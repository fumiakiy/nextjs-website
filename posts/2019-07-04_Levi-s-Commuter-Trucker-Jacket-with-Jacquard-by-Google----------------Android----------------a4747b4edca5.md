---
slug: "/blog/2019-07-04_Levi-s-Commuter-Trucker-Jacket-with-Jacquard-by-Google----------------Android----------------a4747b4edca5"
date: "Thu, 04 Jul 2019 20:45:26 GMT"
title: "Levi’s Commuter Trucker Jacket with Jacquard by Googleの袖から来たデータを機械学習してAndroidアプリで利用できるモデルを作る"
epoch: "1562273126"
excerpt: "Tensorflowで作ったモデルをTensorflow Liteのモデルに変換するまでの苦労話"
---

### Levi’s Commuter Trucker Jacket with Jacquard by Googleの袖から来たデータを機械学習してAndroidアプリで利用できるモデルを作る

### TensorflowのモデルをTensorflow Liteのモデルに変換したい

[/blog/2019-06-15_Levi-s-Commuter-Trucker-Jacket-with-Jacquard-by-Google----------------1ae6347c67fc](前回なんとなく雰囲気で作ったTensorflowのモデル)をAndroidアプリで利用するには、まずTensorflowで訓練したモデルをTensorflow Liteで読めるものに変換しなければならない。[https://www.tensorflow.org/lite/convert](ドキュメント)にはなんだかサラッと[https://www.tensorflow.org/lite/convert/cmdline_examples](コマンドで変換できそうなことが書いてある)のでやってみる。

入力としてモデルを渡すのでまずモデルをシリアライズしてファイルにする。[https://www.tensorflow.org/api_docs/python/tf/estimator/DNNClassifier#export_saved_model](DNNClassifierにはexport_saved_modelっていうメソッドがある)のでこれを呼べばいいんだろうが、こいつに渡す引数がよくわからない。DNNClassifier savedmodelあたりでググり倒してようやく[https://stackoverflow.com/a/55737532](それっぽいコードを見つけた)のだが、これは直接Tensorflow Liteのクラスとメソッドを使ってインメモリのオブジェクトを変換する方法で、いやまあ別に動けばいいんだけども、渡しているものも何が何だかわからん。加えて、モデルを作る過程では一切出てこないセッションだのグラフだのというオブジェクトを「そこにある」前提で扱うコードになっている。`dnn/input_from_feature_columns/input_layer/concat:0`とか`dnn/logits/BiasAdd:0`とか一体どこから出てきたのか。

### Tensorflow Liteで予測してみる

とりあえず上記のコードを[https://gist.github.com/fumiakiy/c1f8fe23b36b0a8984a12cd2bb54cd0e](前回のスクリプト)へコピペして、classifierのtrainをした後で呼び出してみると、確かにconverted_model.tfliteファイルができあがるので、ひとまずこれをTensorflow Liteで推測に使ってみることにした。Tensorflow LiteのドキュメントをみるとPythonでも使えるぽいので、ひとまずスクリプトを書いてみる。

Tensorflow LiteのドキュメントではInterpreterオブジェクトを作ってrunメソッドを呼び出せば結果がoutput引数に返されるぽいことが書いてあるのだが、PythonのInterpreterオブジェクトにはrunメソッドがない。[https://stackoverflow.com/a/51093144](ググって見つけたこのコード)にしたがって、[https://gist.github.com/fumiakiy/a86a834352c1c2c5a8305e46b3a5e751](input_dataだけ自前の配列に変えたスクリプト)を書いて実行してみる。

```
$ python tflite1.py

ValueError: Cannot set tensor: Dimension mismatch
```

はて。次元が合わないというので、配列の配列にしてみる。

```
# input_data = e
input_data = [e]
…
$ python tflite1.py
…
ValueError: Cannot set tensor: Dimension mismatch
```

同じエラー。配列の要素を一つだけ渡してみる。

```
# input_data = [e]
input_data = e[0]
```

```
…
$ python tflite1.py
…
ValueError: Cannot set tensor: Dimension mismatch
```

またまた同じエラー。何を渡せばいいんだかわからないので、とりあえず第一引数で使っている`input_details`の中身をダンプしてみることに。

```
[
{'index': 0, 'shape': array([1], dtype=int32), 'quantization': (0.0, 0L), ‘name’: ‘Const’, 'dtype': &lt;type 'numpy.int64'&gt;},
{'index': 1, 'shape': array([1], dtype=int32), 'quantization': (0.0, 0L), ‘name’: ‘Const_1’, 'dtype': &lt;type 'numpy.int64'&gt;}, …
```

つまりinput_details[0][‘index’]は“0”であると。このtensorはint64型のデータで、shapeは要素数1の配列であるということ…なのかな? ということは、これなら通るのか?

```
# input_data = e[0]
input_data = [e[0]]
```

```
…
$ python tflite1.py
[[1. 0. 0. 0. 0. 0. 0. 0.]]
```

なんか出てきた。要素数8の配列なので、おそらくそれぞれの数値がLABELつまりモデルを作った文字データ(**a, b, c, d, e, h, o, y**)に対応していて、それを示す値が0/1でかえってきた? つまりこのデータから予想される文字は「a」ってこと?

しかし**e[0]**の値しか渡していないのだからこれが正しいわけがないので、input_dataを正しい形にすべく、こんなコードにして、51件の数値を全部渡してみることにした。

```
# input_data = [e[0]]
for i in (range(len(e) — 1)):
    interpreter.set_tensor(input_details[i]['index'], [e[i]])
```

```
…
$ python tflite1.py
[[0.1134394 0.09876031 0.1299585 0.1381347 0.07306363 0.17048864
 0.09710578 0.17904899]]
```

なんかそれっぽい値がかえってきた。これがそれぞれの文字かもしれない可能性を表す数値なんだろうか。eではなくyのデータを与えてみると、

```
# for i in (range(len(e) — 1)):
#     interpreter.set_tensor(input_details[i]['index'], [e[i]])
for i in (range(len(y) — 1)):
interpreter.set_tensor(input_details[i]['index'], [y[i]])
```

```
…
$ python tflite1.py
[[0. 0. 1. 0. 0. 0. 0. 0.]]
```

つまり100%「c」って予想ってこと? ふーむ。output_detailsの方をダンプしてみると、こうなっていて、そういう解釈で良さそうな気がする。

```
[{‘index’: 51, ‘shape’: array([1, 8], dtype=int32), ‘quantization’: (0.0, 0L), ‘name’: ‘dnn/head/predictions/probabilities’, ‘dtype’: &lt;type ‘numpy.float32’&gt;}]
```

ここまで試行錯誤を重ねて、あとはtrainingのstep数やhidden_unitsの中身やらをあれこれいじってモデルを作り直して、また変換して[https://gist.github.com/fumiakiy/a86a834352c1c2c5a8305e46b3a5e751](tflite1.py)を実行してみて、というのを繰り返してみたが、なんとも今一つの結果しか得られない。らちが開かないので、Tensorflow Liteへの変換過程を変えて、Saved Modelとやらにエクスポートすればもう少しそのファイルに何か書いてあるんじゃなかろうかと、DNNClassifierのexport_saved_modelを呼ぶ方法を探すことにした。

### TensorflowのDNNClassifierをSavedModelとして出力する

もう一度「DNNClassifier “saved model”」あたりでググっていくつかそれっぽいサンプルを見ていてようやく[http://shzhangji.com/blog/2018/05/14/serve-tensorflow-estimator-with-savedmodel/](この記事)の中にコピペできそうなコードを見つけた。早速ちょいちょい書き換えて実行してみる。

```
def export_tflite2(classifier, data):
   feature_columns = []
   for i in range(len(data)):
        feature_columns.append(
          tf.feature_column.numeric_column(key=str(i))
        )
```

```
    feature_spec = tf.feature_column.make_parse_example_spec(
                     feature_columns
                   )
```

```
    # Build receiver function, and export.
    serving_input_receiver_fn = tf.estimator.export.
        build_parsing_serving_input_receiver_fn(feature_spec)
    export_dir = classifier.export_savedmodel(
                   'export', serving_input_receiver_fn
                 )
    print(export_dir)
```

なんと「export/1562177753」にそれらしきファイルができた。ファイルはバイナリーでそのままでは読めなかったので、これの中身を調べる方法を探すと、**saved_model_cli**というコマンドがある。実行すると、中に見慣れた文字列が。

```
$ saved_model_cli show --dir export/1562177753 --all
…
 outputs['logits'] tensor_info:
 dtype: DT_FLOAT
 shape: (-1, 8)
 name: dnn/logits/BiasAdd:0
…
```

これは良いものなのでは? 早速[https://www.tensorflow.org/lite/convert/cmdline_examples](tflite_convertコマンド)にかけて、Tensorflow Liteのモデルに変換してみる。

```
$ tflite_convert --output_file=./model1.tflite --saved_model_dir=export/1562177753
…
Some of the operators in the model are not supported by the standard TensorFlow Lite runtime. If those are native TensorFlow operators, you might be able to use the extended runtime by passing — enable_select_tf_ops, or by setting target_ops=TFLITE_BUILTINS,SELECT_TF_OPS when calling tf.lite.TFLiteConverter(). Otherwise, if you have a custom implementation for them you can disable this error with — allow_custom_ops, or by setting allow_custom_ops=True when calling tf.lite.TFLiteConverter(). Here is a list of builtin operators you are using: CONCATENATION, EXPAND_DIMS, FULLY_CONNECTED, PACK, RESHAPE, SHAPE, SOFTMAX, STRIDED_SLICE, TILE. Here is a list of operators for which you will need custom implementations: AsString, ParseExample.
```

Tensorflow Liteのランタイムには存在しないオペレーター(ここではAsStringとParseExample)を使っているので、変換できませんと。使っているのは誰なのかもよくわからんので、とにかくググる。[https://stackoverflow.com/a/55693825](ParseExampleに関しては、このSOの答え)が見つかった。export_saved_modelするときのやり方を少し変えればいいっぽい。やってみる。

```
# feature_columns = []
# for i in range(len(data)):
#     feature_columns.append(tf.feature_column.numeric_column(key=str(i)))
```

```
# feature_spec = tf.feature_column.make_parse_example_spec(feature_columns)
```

```
# Build receiver function, and export.
 # serving_input_receiver_fn = tf.estimator.export.build_parsing_serving_input_receiver_fn(feature_spec)
```

```
features = {}
for i in range(len(data)):
    key = str(i)
    features[key] = tf.convert_to_tensor(np.array(data[i]))
```

```
serving_input_receiver_fn = tf.estimator.export.build_raw_serving_input_receiver_fn(features)
 export_dir = classifier.export_savedmodel('export', serving_input_receiver_fn)
```

無事export/1562179024にファイルができたので、先ほどのsaved_model_cliコマンドで中身をみてみるとだいぶ内容が変わっていた。まあ気にせずtflite_convertを再度実行してみる。

```
$ tflite_convert — output_file=./model1.tflite — saved_model_dir=export/1562179024
…
ValueError: No ‘serving_default’ in the SavedModel’s SignatureDefs. Possible values are ‘predict’.
```

さっきのSOの答えに書いてあったのはこれか、ということでオプションを足して再度実行。SOに書いてあるのとはオプションの名前が違った(signature_def_keyではなくsaved_model_signature_key)。

```
$ tflite_convert --output_file=./model1.tflite --saved_model_signature_key=”predict” --saved_model_dir=export/1562179024
…
Some of the operators in the model are not supported by the standard TensorFlow Lite runtime. If those are native TensorFlow operators, you might be able to use the extended runtime by passing — enable_select_tf_ops, or by setting target_ops=TFLITE_BUILTINS,SELECT_TF_OPS when calling tf.lite.TFLiteConverter(). Otherwise, if you have a custom implementation for them you can disable this error with — allow_custom_ops, or by setting allow_custom_ops=True when calling tf.lite.TFLiteConverter(). Here is a list of builtin operators you are using: ARG_MAX, CAST, CONCATENATION, FULLY_CONNECTED, RESHAPE, SOFTMAX. Here is a list of operators for which you will need custom implementations: AsString.
```

ParseExampleは使わなくなったけど、AsStringはまだエラーのまま。 — allow_custom_opsをつけて実行すればmodel1.tfliteはできるけども、これを先ほどのTensorflow Liteのコードに読み込むと以下のエラーで結局使えない。

```
ValueError: Didn’t find custom op for name ‘AsString’ with version 1
Registration failed.
```

AsStringなんて簡単に実装できるんじゃないのかと思って[https://www.tensorflow.org/lite/guide/ops_custom](custom operatorを自分で実装する方法のドキュメント)を読んでみたけども、C++で書いてTensorflow全体をビルドしなおすってこと? よくわからんが手に負えなさそうなのでやめて、AsStringを使わないような変換を行う方法を探してみる。

もう一度saved_model_cliを実行してみると、中にDT_STRING型の値を出力するtensorがあるのを見つけた。

```
outputs[‘classes’] tensor_info:
 dtype: DT_STRING
 shape: (-1, 1)
 name: dnn/head/predictions/str_classes:0
```

カテゴリー分けしたときのカテゴリー名(ラベル)を持っているのだろうか、よくわからないが使わないのでこれをモデルに含まないようにすればいいんじゃないかと。

tflite_convertコマンドにはoutput_arrayというオプションがあって、これにtensorの名前を指定できるらしい。とりあえず今出力して欲しいのは予測結果だけなので、同じsaved_model_cliの出力にあった「dnn/head/predictions/probabilities:0」だけが出てくればいいやということで、output_arrayに指定してみる。

```
$ tflite_convert — output_file=./model1.tflite — saved_model_signature_key=”predict” — saved_model_dir=export/1562179024 — output_array=dnn/head/predictions/probabilities:0
…
ValueError: Invalid tensors ‘dnn/head/predictions/probabilities:0’ were found.
```

エラー。いや待てよ、さっきダンプしたoutput_detailsによると、このtensorの名前は「dnn/head/predictions/probabilities」みたい。

```
[{‘index’: 51, ‘shape’: array([1, 8], dtype=int32), ‘quantization’: (0.0, 0L), ‘name’: ‘dnn/head/predictions/probabilities’, ‘dtype’: &lt;type ‘numpy.float32’&gt;}]
```

というわけで「:0」を除いてみる。

```
$ tflite_conver --output_file=./model1.tflite --saved_model_signature_key=”predict” --saved_model_dir=export/1562179024 --output_array=dnn/head/predictions/probabilities
```

できた。おお、できたよ。再度[https://gist.github.com/fumiakiy/a86a834352c1c2c5a8305e46b3a5e751](Tensorflow Liteで予測するスクリプト)を実行してみると実行自体はできた。出力は相変わらず意味がよくわからないけど。

```
$ python tflite1.py
```

```
[[0.11178369 0.10516622 0.11024905 0.13274346 0.10095505 0.15692514
 0.09929805 0.18287939]]
```

### Tensorflow Liteのモデルに入力する値

同じモデルに色々な文字のデータを入れて試してみても、何か腹落ちするデータが得られないことがしばらく続いて、そろそろやる気もなくなって来たころ。

何か変だなと思っていたのは、LiteではないTensorflowのclassifierを使ったテストではそれなりに当たりの予測を出すことが多いのに、なぜかLiteになると全然当たらないということ。渡している入力値がおかしいんだろうか。

もう一度saved_model_cliの出力を見直すと、saved modelを使っていなかったときのコード(Tensorflow Liteのクラスとメソッドを使ってclassifierオブジェクトを直接変換したコード)では入力tensorとして「dnn/input_from_feature_columns/input_layer/concat」を使っていて、それに対して現状のsaved_model_cliの出力の中にはそういう入力tensorは存在せず、代わりに「Const_1」「Const_2」というtensorが全部で51個あるのがわかった。**51個**。これはこっちが渡そうとしている1つ1つのデータを入れる場所に違いないので、ループでset_tensorしている今のコードで大丈夫のはず…なんだけど、[https://gist.github.com/fumiakiy/a86a834352c1c2c5a8305e46b3a5e751](input_details[i][‘index’]と、配列の添字ではなくあえてオブジェクトのindexキーを使ってデータをセットしている)のはなんでなんだろう、と思いついて、input_detailsの中身をダンプしてみると、

```
[
{‘index’: 0, ‘shape’: array([1], dtype=int32), ‘quantization’: (0.0, 0L), ‘name’: ‘Const’, ‘dtype’: &lt;type ‘numpy.int64’&gt;},
{‘index’: 2, ‘shape’: array([1], dtype=int32), ‘quantization’: (0.0, 0L), ‘name’: ‘Const_10’, ‘dtype’: &lt;type ‘numpy.int64’&gt;},
{‘index’: 3, ‘shape’: array([1], dtype=int32), ‘quantization’: (0.0, 0L), ‘name’: ‘Const_11’, ‘dtype’: &lt;type ‘numpy.int64’&gt;}, …
```

0番の要素のindexは0だけど、1番の要素のindexは2になっているし、名前もConst_10でConst_1ではない! ということは、テストデータの1番要素の値をinput_details[1][‘index’]に入れてしまうと、1番のtensorにセットすべき値を2番のtensor(本来10番要素の値を入れる場所)にセットしていることになってしまうのでは?

配列の要素とtensorの並びを正規化して、それから正しいtensorに値をset_tensorするようにコードを書き直してみた。

```
# for i in (range(len(y) — 1)):
#     interpreter.set_tensor(input_details[i]['index'], [y[i]])
```

```
indices = [0] * 51
for detail in input_details:
    vindex = 0
    m = re.match(r'Const_(\d+)', detail['name'])
    if (m is None):
        vindex = 0
    else:
        vindex = int(m.group(1))
    indices[vindex] = detail['index']
```

```
for i in range(len(y)-1):
    interpreter.set_tensor(indices[i], [y[i]])
```

実行してみる。

```
$ python tflite1.py
```

```
[[0. 0. 0. 0. 0. 0. 0. 1.]]
```

おお、yをyと予想したっぽい! yをeにして再度実行してみる。

```
# for i in range(len(y)-1):
#     interpreter.set_tensor(indices[i], [y[i]])
for i in range(len(e)-1):
    interpreter.set_tensor(indices[i], [e[i]])
```

```
$ python tflite1.py
```

```
[[0. 0. 0. 0. 1. 0. 0. 0.]]
```

eも正しく予測している! このTensorflow Liteのモデルは良いものなのでは? Androidアプリで実行してみよう!

というわけで次回へ続く。

