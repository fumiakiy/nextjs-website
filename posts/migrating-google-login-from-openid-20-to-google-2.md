---
slug: "/blog/migrating-google-login-from-openid-20-to-google-2"
date: "Sun, 26 Jan 2014 17:15:00 GMT"
title: "Migrating Google login from OpenID 2.0 to Google+ (Part 2 of 3)"
epoch: "1390756500"
---


([Part 1 of this story](/blog/migrating-google-login-from-openid-20-to-google-1))


Google published an article in December 2013 that says "[Upgrading to Google+ Sign In](https://developers.google.com/+/api/auth-migration)". There it says that if you add "data-openidrealm" to your G+ button, you could get the user"s OpenID ident. Woah! That will solve my problem!


Reading through the document, though, turned out that it might not be that easy - because the document tells how to do that only by using either Client-side flow of Hybrid server-side flow - some things they recommend. Our sign-in however is completely done in Pure server-side flow (because it was OpenID before). Migrating the "Login" button itself to adapt to Hybrid flow is not impossible but it will be painful.


So, I started to hack over the document. The document basically says you just add your OpenID realm (or [trust_root](https://metacpan.org/pod/Net::OpenID::ClaimedIdentity#trust_root)) to data-openidrealm attribute to your button"s element, and it does all the heavy lifting. It then links to the [page that describes OpenID Connect.](https://developers.google.com/accounts/docs/OpenID#openid-connect) It says that


```
For applications that use OpenID 2.0, the authentication request URI may include an openid.realm parameter.
```


OK that"s what I want to hear. So this code should do


```
my $uri = URI->new( 'https://accounts.google.com/o/oauth2/auth' );
 $uri->query_form(
 client_id => _config()->{ client_id }
 , response_type => 'code'
 , scope => 'https://www.googleapis.com/auth/plus.login'
 , access_type => 'online'
 , redirect_uri => _redirect_uri()
 , state => time()
 , 'openid.realm' => 'http://peatix.com'
 );
 return $c->res->redirect( $uri );
```


The only part that is really different from what we use for Facebook login (which is also based on OAuth2 but different draft version) is the last argument that sets &lsquo;openid.realm".


The response to the /token endpoint was something like this


```
{
 "access_token" : "...",
 "token_type" : "Bearer",
 "expires_in" : 3600,
 "id_token" : "eyJhbGciOiJSUzI1NiIsImtpZCI6IjVmMWY0ZTc3MWU5OTdkMjFhMDhhZGQ4M2FjYmYxOGM2Y2I0ZTU0NzMifQ.eyJ..."
}
```


&hellip; well, where is my OpenID ident?


I went back to the [OpenID Connect page](https://developers.google.com/accounts/docs/OpenID#map-identifiers) again and found that id_token is what should bear it inside. OK. what is this id_token thing?


Id_token is encoded in the format called JSON WebToken. It"s basically cryptographically signed JSON. I must decode this in order to get the OpenID ident. Searching metacpan.org easily found this gem, er, cpan module, [JSON::WebToken](https://metacpan.org/pod/JSON::WebToken). Oh Perl mongers, how I love thou! Now I just need to `cpanm JSON::WebToken` and call JSON::WebToken->decode( $res->{ id_token }, $key ). Wait, what should I use as $key?


Next up: [finding the key to decode JWT](/blog/migrating-google-login-from-openid-20-to-google-3).

