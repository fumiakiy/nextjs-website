---
slug: "/blog/2019-05-12_Android----------Bluetooth------------5844e20b5b98"
date: "Sun, 12 May 2019 15:43:30 GMT"
title: "AndroidアプリとデバイスとのBluetoothでの通信内容を解析する"
epoch: "1557675810"
excerpt: "Levi’s Commuter Trucker Jacket with Jacquard by Google を手に入れたの続き。"
---

### AndroidアプリとデバイスとのBluetoothでの通信内容を解析する

[Levi’s Commuter Trucker Jacket with Jacquard by Google を手に入れた](/blog/2019-05-05_Levi-s-Commuter-Trucker-Jacket-with-Jacquard-by-Google--------f37ae5a4cde5)の続き。

Jacquardのジャケットとsnap tagの機能を利用するAndroidアプリを作るために、まずは公式アプリでは何をどうやっているのかを調べてみた。前回の記事で触れたとおり、JacquardのサービスのUUIDといくつかのcharacteristicのUUIDはわかったので、それらに向けていつどんなデータが飛んでいるのか、特にLEDを光らせるコマンドはどうやって送られているのかを調べる。

### AndroidでBluetoothログを取る

まずは、公式アプリで3つのうちのどれかのアクションにLightを割り当てておく。

また、Androidの設定で[Developer Optionsの中にある「Enable Bluetooth Host Controller Interface (HCI](https://developer.android.com/studio/debug/dev-options) snoop log」をオンにして)、Bluetoothを切って再度オンにしてやる。これでBluetoothでの通信内容がログに保存される。

そうしてから、Jacquardの3種類のLEDモード（白く光らせるFlash Light、赤く点滅させるSignal、7色?に回転するParty?）を順番に割り当てて、実際に動作させてみる。するとそれぞれの動作は、どれも起動してから30秒で自動終了すること、また実行中にもう一度同じことをする（Brush Inするとか）と停止できることがわかった。

それぞれの動作を行った時間をなんとなく記録して、adbでデバイスからBluetoothログを取得する。[ドキュメント](https://developer.android.com/studio/debug/dev-options)には「Captures all Bluetooth HCI packets in a file stored at “/sdcard/btsnoop_hci.log”」って書いてあるんだけども、最近のAndroidではこのファイルが作られるわけではなく、ログを見るにはbugreportするのが正解らしい。

`adb bugreport hoge`とやると、hoge.zipが落ちてくるので、`unzip hoge.zip FS/data/misc/bluetooth/logs/btsnoop_hci.log`してログを手に入れた。

### WiresharkでBluetoothログ解析

`btsnoop_hci.log`はそのまま人間が読むためのテキストログではないのだけど、幸いなことに[Wireshark](https://www.wireshark.org/)がいい感じにやってくれるので、Wiresharkでファイルを開く。だいたいこんな時間帯にこれをやったよな、ってあたりのログを見て、それらしき通信を探す…

探す…んだけど、[前回あたりをつけた](/blog/2019-05-05_Levi-s-Commuter-Trucker-Jacket-with-Jacquard-by-Google--------f37ae5a4cde5)サービスやcharacteristicのUUIDが全然見つからなかった。あたりはハズレでした。

しかたないので、それらしき時間帯で共通に発生しているらしくて、他の時間帯には発生していないと思われる、ような気がするかもしれない感じのログエントリーを探してみる。すると、snap tag上のサービス「d2f2bf0d-d165–445c-b0e1–2d6b642ec57b」、characteristic「d2f2eabb-d165–445c-b0e1–2d6b642ec57b」に対して謎の値をwriteしていることがわかった。

さらに、その謎の値をwriteした後すぐに、同じサービスの同じcharacteristicから別の値をreadしていること、その30秒後にまた同じサービスの同じcharacteristicから別の値をreadしていることが判明する。しかも3種類のLEDの光らせ方それぞれを行った時間帯にそれぞれ、writeとreadの値だけが異なる通信をしている。これは怪しい。

何度かLEDを光らせてはログを取ってみると、これらの値は毎回若干異なるもののある種のパターンがあり、全然変わらない部分、毎回変わる部分、光らせ方によって変わる部分があることがわかった。例えば赤点滅モードの場合の値は「c0110800100818<strong class="markup--strong markup--p-strong">06</strong>da060808<strong class="markup--strong markup--p-strong">20</strong>107830013801」だったり「c0110800100818<strong class="markup--strong markup--p-strong">1a</strong>da060808<strong class="markup--strong markup--p-strong">20</strong>107830013801」だったりするが、Partyモードの値は「c0110800100818<strong class="markup--strong markup--p-strong">05</strong>da060808<strong class="markup--strong markup--p-strong">10</strong>107830013801」だったり「c0110800100818<strong class="markup--strong markup--p-strong">1b</strong>da060808<strong class="markup--strong markup--p-strong">10</strong>107830013801」だったりする。

そこで、とりあえず自作Androidアプリから同じUUIDsに対してログと同じような値を送りつけてみたらどうなるか、やってみることにした。

### Bluetooth Low Energyのperipheralにコマンドを送る

こんな感じのコードを書いて、BLEデバイスを見つけて、接続して、characteristicを取得して、それに値を書きこんでみる。これが動けば、`startScan`してすぐにsnap tagが光るはず…。

```
private val blinkInRed: ByteArray get() { ... }
```

```
private val bluetoothAdapter: BluetoothAdapter? by lazy(LazyThreadSafetyMode.NONE) {
  val bluetoothManager = getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager
  bluetoothManager.adapter
}
```

```
private var scanner: BluetoothLeScanner? = null
private var gatt: BluetoothGatt? = null
```

```
fun startScan() {
  scanner = bluetoothAdapter?.bluetoothLeScanner
```

```
  val filter = ScanFilter.Builder()
    .setServiceUuid(ParcelUuid(SERVICE_UUID))
    .build()
  val option = ScanSettings.Builder()
    .setScanMode(ScanSettings.SCAN_MODE_LOW_POWER)
    .setCallbackType(ScanSettings.CALLBACK_TYPE_ALL_MATCHES)
    .build()
```

```
  // Start searching the service advertised from a device
  // Get the result in `scanCallback` below
  scanner?.startScan(listOf(filter), option, scanCallback)
}
```

```
private val scanCallback = object: ScanCallback() {
  override fun onScanResult(
    callbackType: Int,
    result: ScanResult?)
  {
    result?.let {
      // Found the service. Connect to the device
      // Get the connection result in `gattCallback` below
      gatt = it.device.connectGatt(context, false, gattCallback)
    }
  }
}
```

```
private val gattCallback = object: BluetoothGattCallback() {
  override fun onConnectionStateChange(
    gatt: BluetoothGatt?,
    status: Int,
    newState: Int)
  {
    if (status == BluetoothGatt.GATT_SUCCESS) {
      when (newState) {
        BluetoothProfile.STATE_CONNECTED -&gt; {
          gatt?.let {
           // Connected to the device. Lookup the service
           // Results come in to `onServicesDiscovered` below
           it.discoverServices()
          }
        }
      }
    }
  }
```

```
  override fun onServicesDiscovered(
    gatt: BluetoothGatt,
    status: Int)
  {
    when (status) {
      BluetoothGatt.GATT_SUCCESS -&gt; {
        gatt.getService(SERVICE_UUID)?.let { s -&gt;
          // Found the service. Lookup the characteristic
          s.getCharacteristic(CHARACTERISTIC_UUID)?.let { c -&gt;
          // Set the binary value to the characteristic
            c.setValue(blinkInRed)
            // Write the value to the characteristic
            // This should light up the LED on the snap tag
            gatt?.writeCharacteristic(c)
          }
        }
      }
    }
  }
}
```

まあ光りませんよね。

そもそもscanに成功しなくなった。それもそのはずで、公式アプリとsnap tagを接続してしまっていたので、snap tagはadvertisementをやめているぽかった。なので、いったん公式アプリでsnap tagをforgetし、Androidの設定からBluetoothデバイス「Jacquard」もforgetする。すると、scanに成功して、connectからcharacteristicを見つけるところまで進むようになった。

が、やはり光らない。`writeCharacteristic`はtrueを返してきたりするんだけど、光らない。このアプリの通信をBluetoothのログをWiresharkで見てみたけど、送っている値や何かが間違っている気配はない。

ここで気になったのは2点。まず、Androidが執拗に「Jacquardからparing requestが来てるけどpairする?」というポップアップが出続けること。まあこれは無視していたんだけど、もう1点、もしこのコードが動作するようなら、そこいら辺にある他人のsnap tagを光らせ放題じゃないか?

### Bluetooth Low Energyにおけるconnectとpairとbond

当然なんだけど、BLEにはちゃんとセキュリティ、特に飛び交うデータの暗号化に関する仕様があって、それを理解しておけって話なんだけども、簡単にいうとググってこの[connecting, pairing and bondingに関する説明](https://devzone.nordicsemi.com/f/nordic-q-a/11939/connecting-bonding-pairing-and-whitelists/45217#45217)を発見して納得した。connectしただけで見られる情報だけでは（おそらく多くの場合で）デバイスの機能を利用することはできず、それをするには鍵交換を行った上でデータを暗号化してやりとりしなければならないと。

となると、Wiresharkで見た情報は鍵が変われば変わってしまうのでは? 鍵はperipheralとclientが同じでも毎回変わるのか?

どうやってそれを調べられるのかわからないので、とりあえず公式アプリを一度アンインストールして、再度インストールして、接続してログを見てみた。値は変わっていなかった。これは多分違うAndroidデバイスだと違う値になるんだろうなあ、当然snap tagが変わればまた違う値になるんだろうなあ、となると、Wiresharkで見た値そのものを公開したところで、他の人はその値を使えないだろうなあ。でも「俺専用の俺アプリ」を作る分にはまあ動くのかも。

### Let there be light

というところまで考えたところで、Androidのドキュメントに戻って、[BluetoothDevice#setPin(byte[] pin](https://developer.android.com/reference/android/bluetooth/BluetoothDevice.html#setPin%28byte%5B%5D%29))と[BluetoothDevice#createBond(](https://developer.android.com/reference/android/bluetooth/BluetoothDevice.html#createBond%28%29))を見つけた。pinの値は、ジャケットを持っていれば知っているはずのアレで、ジャケットにくっついている。公式アプリはこれを入力しなくても値を表示してくれるので、snap tagはこの値もadvertiseしているはずなんだけど、それを探すのは後回し。

そういうわけで、`discoverServices()`を呼び出す前に`setPin`と`createBond`を呼び出してしまう。

```
gatt?.let {
  // Connected to the device. Pair, bond
  it.device.setPin(myJacketPin)
  it.device.createBond()
  // And then lookup the service
  // Results come in to `onServicesDiscovered` below
  it.discoverServices()
}
```

光った！光ったよ！Wiresharkで見た値をそのまま送りつけただけですが、無事光りました。

本当は`createBond`の成否をBroadcastReceiverで受け取ってから操作しないといけないのだが、いったんbondしてしまえば次からはまあ速いので、こんなコードでもちゃんと動いた。

[Levi’s Commuter Trucker Jacket with Jacquard by Googleを操る自作アプリを作る](/blog/2019-06-01_Levi-s-Commuter-Trucker-Jacket-with-Jacquard-by-Google------------8b56fb4732d7)へ続く。

