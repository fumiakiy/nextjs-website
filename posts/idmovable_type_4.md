---
slug: "/blog/idmovable_type_4"
date: "Mon, 27 Aug 2007 11:16:00 GMT"
title: "はてなIDでMovable Type 4ベースのブログにコメントを"
epoch: "1188213360"
---

[先日のhack-a-thon](http://web.archive.org/web/20110731171219/http://www.sixapart.jp/techtalk/2007/07/movable_type_4_hackathon.html)で[MTHatenaStar](/blog/mthatenastar)以外に実はもう1つプラグインを作っていて、でも諸般の事情で完成に至らなかったものがありました。hack-a-thonの最後の発表で、動くところまで見せたんですが、MTHatenaStarと立て続けにやったので、「どんだけはてな好きやねん」などと突っ込まれる始末。

今朝から[id:naoya](https://d.hatena.ne.jp/naoya)さんのヘルプを受けて完成したので公開します。MT4のコメント投稿者認証フレームワークと[はてな認証API](https://auth.hatena.ne.jp)を使って、はてなIDでコメントできるようにするというものです。このブログでもインストールしてあるので、はてなIDでコメントしてみてください。

使い方

1. [はてな認証API](https://auth.hatena.ne.jp)のページで、ご自分のブログ用のAPIキーと秘密鍵を取得する。このとき、コールバックURLとして指定するURLは、コメントフォームのPOST先、つまりCGIPath＋CommentScriptの値（既定ではmt-comments.cgi）にします。ブログのURLではないのでご注意。
1. プラグインのHatenaAuthフォルダを丸ごと、pluginsフォルダにコピーする。
1. MT4にログインし、プラグインの設定画面で、1で取得したAPIキーと秘密鍵を設定し、保存する。
1. ブログの設定画面から登録/認証タブに進み、Hatena IDをチェックして有効にする。
1. ダイナミックパブリッシングをしておらず、しかもこれまで匿名でのコメントしか受け付けないようにしていた場合は、個別のブログ記事アーカイブを再構築する。
1. はてなIDでコメントできます。

[ダウンロード](/downloads/HatenaAuth.zip)