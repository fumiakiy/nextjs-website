---
slug: "/blog/20200815-m5stickc-http"
date: "Sat, 15 Aug 2020 22:45:54 GMT"
title: "M5StickCでベッドサイドのランプをOn/Offする"
epoch: "1597531554"
excerpt: "実際はSonoff Basic R3が楽しかったので味をしめて、何かIoT的なおもちゃでもっと遊べないかなあと思っていた。Sonoff Basic R3を調べる中で、要するにおもしろいのはESP32というWifiとBluetoothが入ったマイクロコンピュータであるのがわかったので、ESP32の開発ボードを眺めては何かできないかなあと。"
ogImage: "/images/m5stickc.png"
---

[Sonoff Basic R3で電源コードにWifi経由でコマンドを送れる](/blog/2020-05-23_Sonoff-Basic-R3-------------------f5498b92027b)ようになって数ヶ月。以前に比べて進化した生活を送れてはいるものの、一つとてもめんどくさいことがある。Apple開発者プログラムに年間購読料を納めないと、iOSアプリのProvisioning Profileが一週間でexpireすること。なんで配布するわけでもないアプリを自分のiPhoneでだけ使うために年間1万円もお布施せねばならんのだ。初詣のお賽銭でもそんなに払わないのに。

とかいいつつ、実際は[Sonoff Basic R3](https://sonoff.tech/product/wifi-diy-smart-switches/basicr3)が楽しかったので味をしめて、何かIoT的なおもちゃでもっと遊べないかなあと思っていた。Sonoff Basic R3を調べる中で、要するにおもしろいのは[ESP32というWifiとBluetoothが入ったマイクロコンピュータ](https://www.espressif.com/en/products/socs/esp32)であるのがわかったので、[ESP32の開発ボード](https://www.espressif.com/en/products/devkits)を眺めては何かできないかなあと。

## WFHとCO2

[弊社も来年の夏まで自宅作業が決定した](https://www.facebook.com/hello.iandco/posts/1186593688375252)ので、仕事環境を少し改善しなければと机や椅子を物色してみたものの、狭い部屋にこれ以上家具を置く気にもならなかった。そんな中、[WFHで環境改善の文脈で部屋の二酸化炭素濃度を測るのが流行っている](https://bunshun.jp/articles/-/36791)のを知る。これだ。

"Arduino CO2 sensor"とかで検索すると、[MH-Z19BというCO2センサーがある](https://www.winsen-sensor.com/sensors/co2-sensor/mh-z19b.html)のがわかった。ArduinoではなくESP32の開発ボードとこのセンサーでCO2濃度をGoogle Sheetか何かに送って可視化するというプロジェクトをやってみよう。

## M5StickCとMH-Z19B

そういうことをしている例を検索してみたところ、[M5StickC](https://m5stack.com/collections/m5-core/products/stick-c)という製品に行き着いた。中にESP32 Picoってのが入ってて、LCD液晶とボタンが2つと、そして汎用IOピンがある。[M5StickCにMH-Z19Bをくっつけて使うためのケースを売っている人もいて](https://kitto-yakudatsu.com/archives/7286) (*1)、この組み合わせは成功例があるらしい。これだ。

```
*1 正確には、MH-Z19Bの利用例を探していてこの記事を見つけ、それでM5StickCというものの存在を初めて知りました。
```

M5StickCもMH-Z19BもAmazonで売っているのだが、検索してみるとそれよりだいぶ安い通販サイトがいくつかある。M5StickCはいろんな場所で売っているのだが、MH-Z19BとM5StickCを両方売っていて安いサイトを探し回った結果、[Banggood](https://www.banggood.com/)で買うことにした。決め手は、最安ではないもののそれなりに安価で両方売っていることと、[MH-Z19Bにピンをはんだ付けしてあるバージョンを売っている](https://www.banggood.com/MH-Z19-MH-Z19B-Infrared-CO2-Sensor-Module-Carbon-Dioxide-Gas-Sensor-for-CO2-Monitor-0-5000ppm-MH-Z19B-NDIR-with-Pin-p-1693604.html?rmmds=search&cur_warehouse=CN)こと。はんだごてを買うよりジャンパーワイヤーを買う方が安いし、まだはんだごてを買うほどのことでもないし。まあこの二酸化炭素センサーをずっと使い続けるならはんだ付けする日も来るかもしれないけど。

説明を読むと、USやカナダにも倉庫を持っていてそこからの発送ならそんなに時間もかからなそうとか。Banggoodの評判を検索するとあまりよろしくないのだが、内容を読むと「洋服を買ったら偽物だった」「クリスマスに欲しかったのに届かなかった」など、いやそれはどうなのよ的なものが多かったので、せいぜい$35だしというわけで、念のためPayPal支払いで7月27日に発注した。

発注して数時間後にはUSPSのトラッキングコードが割り当てられた。しかしそこから8月10日までの二週間、動きは一切なし。8月10日になってNJのUSPSに届き、そこからなぜかPAを経由して8月13日に無事に届いた。USPSのラベルの下に中国語が書かれた別のラベルが貼ってあって、それにはJFK宛てみたいに書いてあったので、結局中国のどこかからどうにかしてJFKに来て、そこから国内発送されたっぽいんだけど、詳細はわからず。でも送料**90セント**、保険70セントで三週間で届いたのでなんの文句もありません。

![M5StickC](/images/m5stickc.png)

## M5StickCでベッドサイドランプのON/OFF

CO2の前にまずは簡単そうなほうをということで、M5StickCをWifiにつなげて、HTTP POSTでコマンドをSonoff Basic R3に送ることで、M5StickCのボタンを押したときにベッドサイドランプをOn/Offできるようにする。M5StickCのWifiでHTTP POSTする方法はそこら中に例があるので詳細は書かないが、一点だけ少しハマった。

Arduinoの`setup() -> loop()`を使ってプログラムを書いた。まずはArduinoのプログラム例でありがちな、`loop()`の中でなんらかの処理をして、`delay(1000)`とかで1秒寝てから`return`し、次`のloop()`が呼ばれる、みたいなコードを書いた。その`loop`の中で`M5.BtnA.isPressed()`を見て「ボタンが押されたら...」というコードを書いたんだが、ボタンを押しても全然反応しない。

`M5.update()`で状態を更新した後、`M5.BtnA.isPressed()`を見ると今その瞬間にボタンが押されたのかどうかがわかるという仕組みなので、`delay(1000)`とかやってると、その1秒間のどこかでボタンを押しても、次に調べたときには`isPressed`はもう見えなくなっているってことだと思う。

結局、`loop()`のなかで`delay`して処理を1秒ごとにするようなことはやめて、`loop()`はクロックに応じて実行されるのだが、中で現在時刻を`millis()`で取って、以前の`millis`と比較して、1000ms経過してたら処理する、ってなコードに変更してうまくいった。

```
unsigned long lastMillis = 0;
unsigned long tick = 0;
unsigned long INTERVAL = 1000; // 1sec

void loop() {
  M5.update();
  unsigned long currentMillis = millis();
  if (currentMillis - lastMillis > INTERVAL) {
    statusUpdate(tick++);
    lastMillis = millis();
  }
  if (M5.BtnA.isPressed()) {
    toggleSwitch();
    powerOff();
  }
}
```

この機能を使うのは、夜寝る前にランプをONにするときと、寝る直前にOFFにするときだけなので、ONやOFFにしたらその度に本体の電源を切ることにした。M5StickCには小さいバッテリーが入っているので、こまめに電源を切っておけば結構長いこと充電なしで使えるはず。

ソース: [https://github.com/fumiakiy/M5StickC/](https://github.com/fumiakiy/M5StickC/commit/c64dc7fb78ee0732c97ae0a726fbdf3e2940c4a1)

[次はCO2センサーにかかろう](/blog/20200815-m5stickc-mhz19b)と思う。

