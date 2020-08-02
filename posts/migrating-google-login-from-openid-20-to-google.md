---
slug: "/blog/migrating-google-login-from-openid-20-to-google"
date: "Sun, 26 Jan 2014 16:30:00 GMT"
title: "Migrating Google login from OpenID 2.0 to Google+ (Part 1 of 3)"
epoch: "1390753800"
---
        
We’ve been allowing users to use their Google accounts to login to Peatix. Until yesterday, however, the code was based on OpenID 2.0 protocol.

commit   
Author: Fumiaki Yoshimatsu  
Date: Mon Sep 12 05:08:37 2011 +0000  
 Added Google OpenID to the list of signin-able external service.

When I thought I’d implement Google login, there have been two options (iirc); OpenID or OAuth 1.0a. IIRC, OAuth2 based login protocol was still in beta or something that it could change later. At that time around September 2011, people still believed that OAuth2 would obsolete OAuth 1.0a. Well, OAuth2 could change, OAuth1 has no future, I’d had to say OpenID was the best choice. And I implemented it.

Fast forward two years, It’s got obvious that

*   [OAuth2 is a dead end](http://hueniverse.com/2012/07/on-leaving-oauth/). At least as an “authentication protocol”.
*   OpenID lives and lives well, although “techy”(cough cough) people tends to see OpenID dead.
*   OAuth 1.0a lives in a good shape - Twitter won the bet.

In other words, in a discussion of “which authentication protocol should I use in 2014?”, OpenID is still not a bad choice.

When it comes to Google login however, there is a different story. “Google+” login that Google is encouraging to implement is based on OAuth2 protocol. And it gives you many benefits over OpenID - seamless login between Android and web for example. By 2014, it became natural for me to want to migrate our OpenID based authentication to Google+.

I started research around that idea around June 2013 (that was when I filed a story in our Pivotal Tracker project). There were two simple requirements:

*   Users can login via Google+ / OAuth2 protocol
*   Existing users with Google OpenID associated to their accounts can still login to land to the same Peatix account without too much hassle

The second part was tough though, because we only keep [$verified\_identity->url](https://metacpan.org/pod/Net::OpenID::VerifiedIdentity#vident-url) in our storage which looks like this

[https://www.google.com/accounts/o8/id?id=AItOawkFEXN4pg8u52IM\_YLN86LIolXUxqKrU3M](https://www.google.com/accounts/o8/id?id=AItOawkFEXN4pg8u52IM_YLN86LIolXUxqKrU3M)

And it didn’t seem like Google would give us both Google+ ID and OpenID for an account so Peatix could match two to migrate the user to Google+ in a seamless manner.

It didn’t seem like so, until December 2013.

To be continued to [Part 2 of this story about migrating Google OpenID to Google+](http://fumiakiy.tumblr.com/post/74620761400/).

