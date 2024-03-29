---
slug: "/blog/meross-smart-wall-switch-1"
date: "Mon, 17 Jan 2022 20:24:09 GMT"
title: "壁に埋め込まれている電気のスイッチをHomekit対応のものに入れ替えた"
epoch: "1642451049"
excerpt: "スマートホーム的な何かをもう少しやってみるために、壁のスイッチを取り替えてみた。"
---

## 序

クロゼットの電灯を点灯するためのスイッチを、諸般の事情で取り替えてみた。諸般の事情とは、暇なので何かやりたい、なぜかクロゼットの電灯はしょっちゅう点けっぱなしになっている、スマートホーム的なアレでどうにかなるのでは、という三段論法（ではない）である。

以前のエントリーでも触れた通り、この手のスマートホーム化にあたって気にしているのは、GoogleだのAmazonだのに接続しないこと。[理想はローカルネットワークで完結して外には出ないし外からも来ないでほしい](/blog/2020-05-23_Sonoff-Basic-R3-------------------f5498b92027b/)。Google AssistantとかAlexaとかは使わないでおきたい。ベッドサイドのランプをアレするのでお世話になったSonoffからも壁に埋め込むスイッチが出ているのだが、これはDIYモードをサポートしておらず、はんだごてを駆使して[Tasmota](https://tasmota.github.io/)あたりを焼かないとならない。それはちょっとめんどくさい。

そこでHomekitである。Homekit対応のデバイス同士の通信はローカルで完結することになっている。iCloudへの登録は必要なので完全にローカルではないが、Homekitを使えるなら、[Sonoff Basic R3のときに問題になった、Apple Developer Programへのお布施](/blog/20200815-m5stickc-http/)をせずにAppleデバイスから操作ができる。これは妥協できるポイントなのではなかろうか。

ちょっと調べてみると、[Merossという会社のSmart wall switchがHomekitに対応していて](https://www.meross.com/product/23/article/)お値段もお安い。こいつでいっちょやってみるかということで、Switchを1つと[Voltage tester](https://www.amazon.com/KAIWEETS-Non-Contact-Electrical-Breakpoint-Tester-VT200/dp/B09BQYV2BR/)を買った。

## 取り付け

左がBefore、右がAfter。

|||
|---|---|
| [![ダサいトグルスイッチ](/images/wall-switch-before.png)](/images/wall-switch-before.png)| [![スマートスイッチ](/images/wall-switch-after.png)](/images/wall-switch-after.png) |

まずはVoltage testerに電池を入れて、ちゃんと動作するかを試す。具体的には、壁のコンセントのLineの方に突っ込んで通電を検知すること、Neutralの方に突っ込んで通電していない状態を検知すること、さらにブレーカーパネルでそのコンセントのブレーカーを切って、Lineの方でも通電していない状態を検知すること、また元に戻すと通電を検知すること、を確認した。

次にSmart wall switchを開封した。中にはスイッチ本体と化粧パネル以外に、工事中にケーブルに貼って識別しやすくするのであろうステッカーと、ケーブルを接続するスクリューキャップも入っていた。良心的。説明書はネットにも上がっているので事前に読んでおいた。

![内容物](/images/smart-switch-contents.png)

準備ができたのでまずはブレーカーを落としてスイッチへ電気を流さないようにする。壁のスイッチからパネルを外してスイッチを取り出す。この状態でブレーカーで電気を入れて、Voltage testerでLoadとLineを調べる。スイッチをOffにした状態で電気が来ている側がLineで、スイッチをOffにしていると電気は来ないが、Onにすると電気が来る方がLoad。今使っているトグルスイッチにはその手の表示がなく、ワイヤーもカラーコードされていないので（両方とも黒だった）、よく見かける「[普通は上がLoadで下がLine](https://orro.zendesk.com/hc/en-us/articles/360019870294-If-my-Line-and-Load-wires-are-the-same-color-how-do-I-know-which-is-which-)」という説を鵜呑みにせず、ちゃんとVoltage testerで調べる。何度かスイッチをOn/Offしたりブレーカーを上げ下げしたりして、Lineに赤、Loadに白の印をつける（付いてきたステッカーはなんかもったいなくて使わなかったw）。

![電気が来てる](/images/voltage-tester.png)

調べ終わったらスクリューからワイヤーを外す。次に、中のスイッチボックスから現時点では使われていなくて素通ししている、ニュートラルのケーブルを取り出す。実はこれもSmart wall switchを買う前にすでにここにあることを確認してあった。というのもSmart wall switchの多くはこのニュートラル配線がないと使えないものもあるからだ。今回買ったものも「Neutral required」とそこかしこに書いてあるので、先に確認してから買わないと。さすがにニュートラルは白いワイヤーだった。よかった。

|||
|---|---|
| [![ケーブル識別後](/images/cables-identified.png)](/images/cables-identified.png)| [![スイッチ取り外し](/images/old-switch-removed.png)](/images/old-switch-removed.png) |

あとはSmart wall switchから出ている4本のケーブルを壁から出ている4種類のワイヤーに連結するだけ。このSmart wall switchはケーブルも少し剥いてあったりして良心的。緑(Gnd)を緑とからめてスクリューキャップにねじ込んでネジネジして、引っ張って抜けないことを確認する。白いニュートラルは、付いているスクリューキャップを外して、巻き込まれている電線を少し戻して、Smart wall switchから出ている白いケーブルを巻き込んで再度スクリューキャップをネジネジする。

Smart wall switchには「Lin(黒)」と「Lout(茶)」というケーブルが出ているので、LinをLineと、LoutをLoadと、ネジネジしてつなぐ。このあとスイッチボックスの中にぎゅうぎゅうに押し込むので、押し込んでいる途中で抜けないように引っ張って確認する。

![ケーブル接続完了](/images/cables-connected.png)

この状態でブレーカーをあげて電気を通し、スイッチを押してみてクロゼットの電灯のOn/Offを確認する。緊張の一瞬。問題なくうまく行った。再度ブレーカーを下げて電気を切り、なるべくうまいことケーブルとSmart wall switch本体をスイッチボックスに押し込む。あとはねじ止めしてパネルをはめ込めば完成。

## セットアップ

Homekitでアクセサリとして登録するために、まずiPadを2.4GhzのWifiにつなぐ。うちにはApple TVやHomepodはないので、iPadをHomekitのハブにする設定も行った。それからSmart wall switch本体に書いてあるHomekit接続用のコードを入力する。最初なんだか失敗して焦ったが、同じことをもう一度やったら登録できた。あとはHomeアプリでタップすれば電灯をOn/Offできる。

Android用にはMerossのアプリがあって、これを使うとHomekitではできない機能（On後指定された時間がたったら自動的にOffにするとか）を使えるようになるのだが、ユーザー登録が必要で、「ローカルで完結」のポリシーに反する。反するが、ファームウェアのアップデートやなんかにも必要になるっぽいので、仕方なく捨てAndroidタブレットに捨てメールアドレスでアカウントを作った。

## まとめ

事前にある程度まで調べてから買ったこともあって、取り付けやセットアップは概ね問題なくできた。

しかし実は本命はクロゼットの電灯ではなく別のことにあるので、さっそく同じSmart wall switchをもう1つ購入した。続く。