---
slug: "/blog/-atomapiphotouploader-1"
date: "Sat, 26 Feb 2005 08:36:00 GMT"
title: "続 AtomAPIPhotoUploader"
epoch: "1109406960"
---

[Update](/blog/_atomapiphotouploader/) こちらに新しい版があります。

ご要望があったので英語対応してみました。バイナリはこちらでソースはこちら。.NET Frameworkの国際化関係の機能を使ってます。ので、英語圏の人はen-USフォルダとその中のDLLが必須です。en-USフォルダは、EXEと同じ場所になければなりません。日本の人はEXEだけでも動作します（en-USフォルダが存在しても別に問題ありません）。とはいえ英語OS上でまともにテストしてないので、

あとソースは.NET Framework SDK 1.1だけでビルドできるようにしました。VS.NET 2003は必要ありません。っていうかVS.NET 2003を使うと国際化関係のところが壊れますのでご注意を。いえ、これはVS.NET 2003が悪いわけではなく、最初にそう作っちゃったからというだけです。

サテライトアセンブリを作るだけで他の言語にも対応できるはずです。