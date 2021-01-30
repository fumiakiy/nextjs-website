---
slug: "/blog/_atomapiphotouploader"
date: "Sun, 27 Mar 2005 16:05:00 GMT"
title: "続続 AtomAPIPhotoUploader"
epoch: "1111939500"
---

FlickrがLifeblogすなわちAtom PPに対応したってことなんで、拙作のAtomベースのアップローダもFlickrにあっさり対応...、と思いきや苦難が。

まず、Flickrの認証はX-WSSEなんですが、（たしか）昔のTypePadと同じ、[NonceをBase64エンコードしない方式](https://www.xml.com/pub/a/2003/12/17/dive.html)なんで、それに対応しなければならなかった。

まあそれはすでに通った道なんですぐに対応できたものの、いくらやっても「Not a valid mime-type for relation.」という非常に親切なエラーメッセージ。仕方なくNokiaでLifeblogのPC版を落としてインストールし、ポストして、XML on the wireの解析へ。

で、いろいろ変わった実装をしているもんで、どれがキーポイントなのかまた試行錯誤。Lifeblogが生成するAtom entryを見ると、なんと<content>の中身をいわゆるRFC 2045ばりに、72文字という中途半端な数で改行してやがんの。まさか？と思ってそれに対応してみたけど、やっぱりエラーは変わらず。

んで、さらにXMLを眺めてみると、<standalone xmlns="http://sixapart.com/atom/typepad#">1</standalone>という謎の要素を発見。それを挿入してみたらなんと動いちまった。なんてこった。

そういうことで最新バイナリはこちらで最新ソースはこちら。あー、あとFlickrのPOST URLは http://www.flickr.com/services/atom/post/ なんで念のため。リソースには入れてません。

一応書いておきますが、書くまでもなく、こんなのよりFlickrのアップローダのほうが優れています。僕自身Flickrのアップローダつかってます（笑）。まあAtomなんざ「まだ実装すんな」っていう仕様なんで。でも実装がないまま進む仕様化ってのも危険なんで、実装してみるってのに意味はあるかな、と。なんだそりゃ。

これまでの経緯。
- [続 AtomAPIPhotoUploader](/blog/-atomapiphotouploader-1/)
- [改め、AtomAPIPhotoUploader。](/blog/atomapiphotouploader/)
- [はてなフォトライフアップローダー](/blog/post-43/)

あとついでに発見したのは、NokiaのLifeblog PC版にはCOMAtom.dllというCOMベースのAtom PP実装が含まれてる（と思われる）ってことですね。CreateObject("COMAtom.AtomClient")ってな感じでいけるっぽい。やっぱCOMがキテるらしいってことでオチがつきました。

## Comments:

あーすいません（あやまることでもないんですがｗ

[http://cognections.typepad.com/lifeblog/2004/12/lifeblog_postin.html](http://cognections.typepad.com/lifeblog/2004/12/lifeblog_postin.html)

atom:standalone エレメントは Lifeblog 用の atom 拡張で、仕様書の 2.4.1 Posting Lifeblog Items に載っています。

- posted by [miyagawa](https://www.blogger.com/profile/3736463) : 2:02 午前

ちょっと前にこういうのつくってました。
[http://blog.bulknews.net/flickr2typepad.cgi](http://blog.bulknews.net/flickr2typepad.cgi)

これは flickr から AtomPP (LifeBlog API) をつかって TypePad にポストです。

- posted by [miyagawa](https://www.blogger.com/profile/3736463) : 2:08 午前