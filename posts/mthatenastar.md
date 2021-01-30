---
slug: "/blog/mthatenastar"
date: "Sat, 25 Aug 2007 05:50:00 GMT"
title: "MTHatenaStar作った"
epoch: "1188021000"
---

[はてなスター](https://s.hatena.ne.jp)をMovable Typeで表示する方法はいろんな人が書いてるけど、やっぱHTMLタグ書くのはMTらしくないだろーってことで、今日のhack-a-thonでMTHatenaStarを書いてみた。

出力するHTMLについては、「[さりげないはてなスター](https://blog.fuktommy.com/1184165578)」に書いてあったHTMLを丸ごといただきました。ありがとうございます。

使い方

1. はてなスターにブログを登録し、トークンを入手する。
1. プラグインフォルダにMTHatenaStarフォルダを丸ごと放り込む。
1. プラグインの設定画面で、１で取得したトークンを入力し、保存する。
1. はてなスターを表示したい場所に<$MTHatenaStar$>を書く。ただし、MTEntriesのコンテキスト内（つまり、MTEntryTitleとかを使える場所）に。
1. 再構築（ダイナミックパブリッシングなら不要）。
1. はて☆スタ。

はてなスターを表示する場所に<script>タグも一緒に表示されちゃうのがいやなときや、はてなの指示通りに<head>の中に書きたいときは、<$MTHatenaStarScript$>タグを使えば、<script>だけを別途出力できます。ただし、処理の関係で<$MTHatenaStar$>よりは前に置く必要があります。

もちろんダイナミックパブリッシング対応だよ！

[ダウンロード](/downloads/MTHatenaStar.zip)