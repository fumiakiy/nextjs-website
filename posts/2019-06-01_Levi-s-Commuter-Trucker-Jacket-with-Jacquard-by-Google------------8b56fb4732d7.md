---
slug: "/blog/2019-06-01_Levi-s-Commuter-Trucker-Jacket-with-Jacquard-by-Google------------8b56fb4732d7"
date: "Sat, 01 Jun 2019 15:09:41 GMT"
title: "Levi’s Commuter Trucker Jacket with Jacquard by Googleを操る自作アプリを作る"
epoch: "1559401781"
excerpt: "スマートジャケットからの情報を得て何かするAndroidアプリを作ってみる"
---

### Levi’s Commuter Trucker Jacket with Jacquard by Googleを操る自作アプリを作る

### LEDを思いどおりに光らせる

[/blog/2019-05-12_Android----------Bluetooth------------5844e20b5b98](前回)までで書いたとおり、公式アプリとsnap tagとの通信をWiresharkでのぞいて見て、同じ値を自作アプリから同じBluetooth serviceの同じcharacteristicに送りつけてみたら同じように光ったので、同様の手順で公式アプリがサポートしている3種類の光らせ方とその値をメモってみた。すると、一部だけ異なる値を送っていることがわかった。何度も同じ光らせ方をさせてみると、その度に変わる部分と、光らせ方が同じなら変わらない部分があることもわかった。そういうわけで、こういう単純なコードで、3種類のうちから希望の光らせ方をする値を作って送りつけることはできるようになった。

```
fun valueToWrite(command: Command): ByteArray {
  val b = UByteArray(19)
  
  // It seems these two bytes varies among snap tags
  b[0] = 0xc0U
  b[1] = 0x11U
  
  // Together with these 5 bytes, the first 7 bytes could be a tag's id?
  b[2] = 0x08U
  b[3] = 0x00U
  b[4] = 0x10U
  b[5] = 0x08U
  b[6] = 0x18U
  
  // The 8th byte seems like an id of the command.
  b[7] = sequenceId
  
  // The next 4 bytes don't seem to change
  b[8] = 0xdaU
  b[9] = 0x06U
  b[10] = 0x08U
  b[11] = 0x08U
  
  // The 13th byte seems like the command
  b[12] = command.value
  
  // The following 6 bytes don't seem to change
  b[13] = 0x10U
  b[14] = 0x78U
  b[15] = 0x30U
  b[16] = 0x01U
  b[17] = 0x38U
  b[18] = 0x01U
  
  return b.toByteArray()
}
```

```
...
characteristic.setValue(valueToWrite(command))
gatt?.writeCharacteristic(characteristic)
```

### ジェスチャーを取得する

次に、これも公式アプリでサポートされている、Jacquardの糸を触ることで通知を受け取る機能を実装してみる。LEDを光らせるのは自作のアプリからsnap tagへ向けてデータをwriteすればよかったのだが、これをするにはBluetoothの通知機能を利用しないといけない。具体的には、snap tagが出しているserviceのうちどのcharactersticがこの通知を発信しているのかを探し出して、それに対して通知を有効にした上で、callbackのメソッドで値を受け取る。

```
val CLIENT_CONFIG_DESCRIPTOR_UUID = "00002902-0000-1000-8000-00805f9b34fb"
```

```
jacquardService?.characteristics
  ?.forEach { characteristic -&gt;
    characteristic.descriptors?.filter {
      it.uuid == UUID.fromString(CLIENT_CONFIG_DESCRIPTOR_UUID)
    }
    ?.lastOrNull()?.let { desc -&gt;
      desc.setValue(BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE);
      gatt?.writeDescriptor(desc);
      gatt?.setCharacteristicNotification(desc.characteristic, true)
    }
  }
```

```
...
  override fun onCharacteristicChanged(gatt: BluetoothGatt?, c: BluetoothGattCharacteristic?) {
    Timber.d("changed ${c?.uuid}: ${c?.value?.size} == ${c?.value?.map { b -&gt; String.format("%d", b) }?.joinToString(":")}")
  }
```

とりあえず通知をしてくるcharacteristicすべてをlistenしてログを見ようとやってみたのだが、どうもそれらしき通知がこない。あるcharacteristicからの通知しかこなくて、その値は明らかに別の用途のものだった。

ひとしきりうなってからググると答えがすぐに見つかった。通知を受け取るには、characteristicのdescriptorに対して通知を有効にするように値を書き込む必要があるのだが、ある書き込み要求が完了するまで次の書き込みはできないらしい。つまり、descriptorWriteが完了したというcallbackのメソッドの中で次の書き込みをしないとならない。連続ですべてのcharacteristicに対して通知を設定しようとしていたので、リストの先頭のcharacteristicのものしか設定されていなかった。

ちょいちょいとテキトーにコードを書き直したところ、他の通知も来るようになり、ジェスチャーが発生したときの通知は「d45c2030–4270-a125-a25d-ee458c085001」のcharacteristicであること、ジェスチャーそれぞれに以下のような値が割り当てられていることがわかった。

```
enum class GESTURE(val raw: ByteArray) {
  DOUBLE_TAP(ByteArray(1, { i -&gt; 0x1 })),
  BRUSH_IN(ByteArray(1, { i -&gt; 0x2 })),
  BRUSH_OUT(ByteArray(1, { i -&gt; 0x3 })),
  COVER(ByteArray(1, { i -&gt; 0x7 })),
  BRUSH_OUT_IN(ByteArray(1, { i -&gt; 0x8 })),
  UNKNOWN(ByteArray(1, { i -&gt; 0x0 }))
}
```

おもしろいことに、公式アプリでは使われていないもう1つのジェスチャー（BRUSH_OUT_IN）が存在した。たまたまBRUSH_OUTした後に惰性で少し触り続けていたら違う値が飛んできたのでわかったのだが、OUTした後INする動作を連続で行うとこのジェスチャーが認識される。公式アプリで使われていないのは、多分他のジェスチャーと混同しちゃうからだと思う。BRUSH_OUTはジェスチャーと認識されるまで少しラグがあるっぽいのもこれのせいか。

### 「生」データを取得する

さっきジェスチャーの通知を取得しようとしていて別の用途の通知が来たと書いたが、それがなんで別の用途だとわかったかというと、とにかくJacquardの「糸」に触れると何発も飛んでくるからだった。これは明らかに糸を触ったときのデータが来てる。つまり、決められたジェスチャーについてのデジタルなデータだけではなく、触った糸についてのある種アナログな情報も通知が来るということ。これも公式アプリにそれっぽい画面があるので、そういう情報も取れることは想像できるのだけども。

この生データ、18バイトのデータが来るのだが、先頭の1バイトは明らかにシーケンス番号で、次の2バイトは割と固定のデータで、残りの15バイトの値が触り方によってずいぶん変化する。糸を数えてみるとやっぱり15本。というわけで、3から18までのインデックスの値が糸の触り方を示すっぽい。

そこで公式アプリと同じような、こんな感じの見た目のViewを作ってみたところそれっぽい動きが見えるようになった。

この値をどう使うかについてちょっとアイデアが浮かんだのでやってみたいんだけど、時間と手間が掛かりそうでうーん。とりあえずは、ここまでの調査でできたものを、コードをきちんと書き直して公開するのを先にやろうかな。とはいえこのジャケットを持っている人が少ないしコードを書く人はもっと少なそうだから公開しても誰の役にも立たなそうだけども。

[/blog/2019-06-15_Levi-s-Commuter-Trucker-Jacket-with-Jacquard-by-Google----------------1ae6347c67fc](Levi’s Commuter Trucker Jacket with Jacquard by Googleの袖を手書き認識デバイスにする)へ続く。

