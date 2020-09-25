---
slug: "/blog/2019-06-15_Levi-s-Commuter-Trucker-Jacket-with-Jacquard-by-Google----------------1ae6347c67fc"
date: "Sat, 15 Jun 2019 15:44:21 GMT"
title: "Levi’s Commuter Trucker Jacket with Jacquard by Googleの袖を手書き認識デバイスにする"
epoch: "1560613461"
excerpt: "ジャケット（についてるsnap tag）からJacquardの糸に触れたときの連続的なデータを使って遊んでみる。"
---

### Levi’s Commuter Trucker Jacket with Jacquard by Googleの袖を手書き認識デバイスにする

[前回まで](/blog/2019-06-01_Levi-s-Commuter-Trucker-Jacket-with-Jacquard-by-Google------------8b56fb4732d7)のコードで、ジャケット（についてるsnap tag）から飛んでくる情報、特にJacquardの糸に触れたときのなんというか連続的なデータをアプリで取得できるようになった。今のところこの情報は公式アプリでもデモ目的以外には使われていなくて、Double TapやBrush In/Outなどのイベントはsnap tag側で先に判別された上で、そのIDがある種デジタルな、離散的な値として飛んできて、公式アプリはそれに対して反応することができるだけになっている。

連続的なデータを使って何かできないかということで思いついたのが、袖をなぞって発生する一連のデータを文字として認識させて、キーボードのように使えるようにすること。それを実現するために、何度もある文字をなぞったデータを機械学習にかけて、15本の糸のなぞられ方から文字を判別するモデルを作成して、あわよくばそれをアプリ上で実行してキーボードのように使う。

機械学習とかやったことないしPythonもほとんど書いたことないのだが、まあStackoverflowでなんとかなるだろうと思って始めてみた。

### 学習用データの収集

学習させたいデータがないと学習させられないので、まずはデータを作る。最初は糸1本ごとの触られっぷりを示すらしき1バイトのデータをそれぞれカラムとして保存して、さらに1つの文字を書くのにある程度の数のデータが連続して送られてくるので、1文字の書き始めと書き終わりまでの系列データを並べた2次元の配列を考えた。一方の軸の大きさは15で固定で、もう一方の軸の大きさは文字の書き終わりまでに送られていたイベント数ということになる。

このアプリ上で、教師あり学習用のデータを作るためにa, b, cの文字ををそれぞれ10回程度ずつなぞって、書き終わるたびに1つの文字のデータとして記録して、ログを吐き出した。したがって吐き出されたデータはこんなのが並んでるファイルとして保存される。

```
0,0,c,d,0,1,2,3,4,5,0,0,0,0
0,0,0,0,4,3,2,1,a,a,a,a,0,0
0,0,0,0,c,d,0,1,2,3,4,5,0,0
0,0,0,0,0,0,4,3,2,1,a,a,a,0
…
```

さて少量ながらデータが集まったので、解析してみる。ググってStackoverflowして行くと、やろうとしていることはいわゆるカテゴリー（クラス）分けで、「教師あり学習で分類を行う」ということになるらしい（反対語? は「教師なし学習」「回帰」らしい）。”supervised classification algorithm” とか、さらに”small dataset”で検索してみると、support vector machine (SVM) またはNaive Bayesというアルゴリズムがあること、これらのアルゴリズムをお手軽に使えるツールとしてscikit-learnというのが使えることがわかった。scikit-learnがPythonで使えるモノであるということは知ってるし、Naive BayesアルゴリズムはCPANモジュールもあって前職でお遊びながら使ったことがあった、という程度の知識でスタート。

### scikit-learnで使える学習データを作る

scikit-learnとNaive Bayesで検索してみるといくつか入門記事が見つかるのだが、そのほとんどが[irisつまりアヤメのデータからそのアヤメの分類を当てるという例](https://www.ritchieng.com/machine-learning-iris-dataset/)が出てくるので、とりあえずそれをやってみる。写経して動かして、ははあなるほど、と。

次にirisのデータを自分のデータに置き換える方法を探ってみる。irisのデータは1つの種ごとに4つのカラム（petalのwidthとlength, sepalのwidthとlength）があって、それらが3種類のアヤメに分けられるらしい。それをこんな風にデータ化している。

```
[
 [ 5.1 3.5 1.4 0.2]
 [ 4.9 3. 1.4 0.2]
 [ 4.7 3.2 1.3 0.2]
 [ 4.6 3.1 1.5 0.2]
 [ 5. 3.6 1.4 0.2]
 …
]
```

こちらが使いたいデータはさっき書いたように1つの文字に対して2次元の配列になっている。こういう風に単純に置き換えて渡してみてもエラーになる。

```
[
 [
 [0,0,12,13,0,1,2,3,4,5,0,0,0,0],
 [0,0,0,0,4,3,2,1,10,10,10,10,0,0],
 [0,0,0,0,12,13,0,1,2,3,4,5,0,0],
 [0,0,0,0,0,0,4,3,2,1,10,10,10,0],
 …
 ],
 …
]
```

```
ValueError: Found array with dim 3. Expected &lt;= 2
```

次元が多すぎるってことで、次元を減らすために適当にググって見つけたこんなコードで適当に次元を減らす。

```
X = X.reshape(X.shape[0], -1)
```

一応走りはするものの、こんな次元の減らし方では特徴を正しく捉えたデータになっているとは思えない。

つまり、糸1本1本を別のカラム（次元）として扱うとこれら連続データをただしく渡せないことがわかったので、データの取り方を変えて、1イベントにつき1列で15本の糸のデータを表す値を作ることにした。具体的にはこんな感じで0本目の糸のデータには2**0を、1本目の糸のデータには2**1をそれぞれかけて…とやって1つの大きな数値を作ることにした。これで意味が失われていないのかすごく疑問だが、まあドンマイ。

```
var data = 0
bytes.forEach { byte -&gt;
 val digit = Math.pow(2.toDouble(), (bytes.size — 1).toDouble())
 data += Math.ceil(digit * byte).toInt()
}
```

こうして、1つの文字に対してこんな数値が並んだデータを再度a, b, cごとに10ずつくらい作り直して、Python再開。

```
5931008,
5308416,
5013504,
3473408,
…
```

### scikit-learnでモデルを作る

さっきと同じように、irisのデータを作っている箇所を自分のデータ用に変形してみる。当然ながら、それぞれの文字のそれぞれの学習データの大きさは同じでないといけないので、適当にファイルをいくつか眺めて、1つの文字のデータ行数を51にして、連続する同じデータはすべて削ってしまうことにした。これもデータの意味を消してしまっている気がするがドンマイ。

Perlスクリプトをちょいちょい書いてデータを揃えたら、そのファイルをPythonで読み取って、データを食わせてテストしてみる。データ数が少なすぎるし信頼性は低いけど、とりあえずできた。

```
import os
import re
```

```
import numpy as np
# from sklearn.svm import SVC
from sklearn.naive_bayes import GaussianNB
from sklearn.model_selection import train_test_split
```

```
LABELS = [‘a’, ‘b’, ‘c’]
```

```
# read all data and make an array of array of data
path = ‘./normalized/’
data = {‘a’: [], ‘b’: [], ‘c’: []}
for f in os.listdir(path):
 datum = []
 m = re.match(r’(\w)_(\d)\.txt’, f)
 if (m is None):
 continue
 char = m.group(1)
 with open(os.path.join(path + f), ‘r’) as lines:
 for line in lines:
 datum.append(int(line.rstrip()))
 data[char].append(datum)
```

```
# construct the ml stuff
```

```
target = []
samples = []
for char, ar in data.items():
 for datum in ar:
 target.append(LABELS.index(char))
 samples.append(datum)
```

```
# clf = SVC()
clf = GaussianNB()
X = np.array(samples)
y = np.array(target)
X_train, X_test, y_train, y_test = train_test_split(samples, target, test_size=0.1, random_state=0)
```

```
clf.fit(X_train, y_train)
print clf.score(X_train, y_train)
```

```
print clf.predict(X_test)
print y_test
```

```
$ python t1.py
0.7941176470588235
[2 0 2 0]
[2, 1, 2, 2]
```

### Tensorflowで同じことをやってみる

目的は作ったモデルをAndroidアプリにデプロイして、入力されたデータから文字を推測することなので、scikit-learnで作ったモデルだとやりづらそう。

Tensorflowでモデルを作ればTensorflow LiteでAndroidアプリ上で利用できることは知っていたので、scikit-learnで作ったモデルをTensorflowのモデルに変換できるのかを調べたが、まあよくわからないけど簡単にはできませんよね。Tensorflowはニューラルネットワークのためのもので、SVCとかGaussianNBとかはそうじゃないとかなんとかよくわからん。

それじゃあTensorflowで似たような感じで分類を行うことはできるのかと思って、”Tensorflow iris”とかでググったら[TensorflowにもDNNClassifierというものがあってアヤメの分類ができる](https://www.tensorflow.org/guide/premade_estimators)らしい。早速それを行なっているコードをサンプルから探して、実行してみて、自分のデータで置き換えてみるというさっきと同じ作業を今度はTensorflowのコードでやってみる。まあ[できたのはできた](https://gist.github.com/fumiakiy/cc9107e2f4b66dbc0a20ee1eabc04dc1)。全然当たってないけど。

```
$ python tf.py
```

```
Test set accuracy: 0.788
```

```
Prediction is “2” (100.0%), expected “2”
```

```
Prediction is “2” (66.6%), expected “0”
```

```
Prediction is “2” (66.6%), expected “1”
```

### 文字を増やす

ここまでやっている間ずっと心配に思っていたのは、aと**d**やbと**h**やcと**e**を本当にこんなデータで区別できるのかということ。そこで、d, e, h, o, yの5つの文字をさらに10ずつくらいログにとって、同じPerlスクリプトで整形して、[scikit-learnのコード](https://gist.github.com/fumiakiy/b8018b441d51639d3690ad003bebce0a)にかけてみた。

```
$ python sk2.py
0.49504950495049505
[6 1 0 1 6 0 6 5 0 1 6 4]
[6, 0, 2, 0, 6, 3, 3, 7, 2, 0, 5, 4]
```

そこそこ? [Tensorflowでやってみる](https://gist.github.com/fumiakiy/c1f8fe23b36b0a8984a12cd2bb54cd0e)とどうだろう。

```
$ python tf2.py
```

```
Test set accuracy: 0.195
```

```
Prediction is “4” (15.8%), expected “2”
```

```
Prediction is “4” (15.8%), expected “0”
```

```
Prediction is “4” (15.8%), expected “1”
```

ガーン。ものの見事に全然区別できてない。ニューラルネットワーク様にはもっとたくさんデータを食わせないとダメなのかあとか思いながら、アルゴリズムを変えてみたりあーだこーだしていてふと気づいた。DNNClassifierに渡している「hidden_units」ってなんだ。

ニューラルネットワークでディープラーニングってのは、[それっぽい絵](https://www.mapleprimes.com/maplesoftblog/209354-A-Beginners-Guide-To-Using-The-DNN)を見てみると、入力から出力の間に通る場所をいくつも作っていくものらしい。どこかのサンプルから写経した[10, 10]を渡しているけど、これはニューラルネットワークのinputとoutputの間にあるよくわからん神経ノードの数と層を表しているのだから、ここを増やせば精度が上がるんじゃないか? データも少ないし、適当に[20, 40, 20]などと渡してみた（前掲リンク先のを真似した）。

```
$ python tf2.py
Test set accuracy: 0.929
```

```
Prediction is “2” (100.0%), expected “2”
```

```
Prediction is “0” (100.0%), expected “0”
```

```
Prediction is “1” (48.4%), expected “1”
```

…精度が急上昇しました。

ちょっと本当かなと思って、[20, 40, 80, 40, 20]とかも渡してみたら精度が1.000のオール100%なんてことになったこともあったんだけど、こんな程度のデータ量だと(?)試行するたびに全然違う数値が出てくるので、一喜一憂しても仕方ない。このままデータを増やしていっても、aとdをより精度高く判別できるようになるとは正直思えないし。

だが、まあとりあえず小文字のアルファベットのデータを全部作って、できたモデルをTensorflow Liteに乗せてAndroidで実行してみるモチベーションが湧くくらいの精度ではあるので、次に進もうと思う。

[Levi’s Commuter Trucker Jacket with Jacquard by Googleの袖から来たデータを機械学習してAndroidアプリで利用できるモデルを作る](/blog/2019-07-04_Levi-s-Commuter-Trucker-Jacket-with-Jacquard-by-Google----------------Android----------------a4747b4edca5)へ続く。

