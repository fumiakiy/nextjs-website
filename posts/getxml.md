---
slug: "/blog/getxml"
date: "Tue, 08 Nov 2005 09:47:00 GMT"
title: "GetXMLプラグインの文字化け解消"
epoch: "1131443220"
---

RSSをサイドに表示できるプラグインはないもんかと思ってたら、[GetXML](http://www.staggernation.com/mtplugins/GetXML/)ってのを見つけた。RSSに限らずXMLを表示できるってので早速導入。Last.fmのXMLを表示するようにテンプレートを書いてrebuildすると、どういうわけだかGetXMLプラグインが表示する部分は日本語が出てるのに、他の部分（本文など）の日本語は全部文字化けした。何じゃこりゃ？

と、化けた文字を見てるうちに思い出したのが[AWSで文字化けしたこのときの記憶](http://blog.bulknews.net/mt/archives/001773.html)。これですよたぶんそうですよ。で、「Perl の Unicode フラグ」って何さってググったらずばり「[Perl 5.8.x Unicode関連](http://web.archive.org/web/20060212151726/http://www.pure.ne.jp/~learner/program/Perl_unicode.html)」ってページ発見。ふむふむ。

1. 今までUTF-8の日本語が問題なく表示されていた。
1. GetXMLで何かが悪いに違いない。
1. GetXMLは特に文字をいじってないからXML::Simpleが悪いに違いない。
1. UTF-8フラグってやつは悪いヤツらしい。
1. XML::Simpleを通ると、文字列にフラグが付いてしまうのかもね。
1. じゃあ返された文字列のフラグを外してしまえばいいのでは。
1. 外すには『utf8::encode($alpha); # UTF8フラグを落す(Encode::encode_utf8 と同じだが、引数を変化させる)』って書いてあるぞ。
1. GetXMLのget_valueにパッチ当てちゃえ。
    ```
    203a204
    > utf8::encode($text);
    ```
1. Save and Rebuild。
1. おー日本語出た。

勘でも何とかなるもんですね。＜オチなしｗ