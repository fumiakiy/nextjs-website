---
slug: "/blog/migrating-google-login-from-openid-20-to-google-3"
date: "Sun, 26 Jan 2014 18:03:00 GMT"
title: "Migrating Google login from OpenID 2.0 to Google+ (Part 3 of 3)"
epoch: "1390759380"
---

([Part 1 of this story](/blog/migrating-google-login-from-openid-20-to-google-1))

Google+ Sign In returns id_token that is a JWT encoded information of various stuff related to the account, along with access_token which could be used to call other Google APIs. In order to get the OpenID ident for the user, I had to decode JWT and that requires a key to decode it.

[According to another document about how to validate id_token](https://developers.google.com/accounts/docs/OAuth2Login#validatinganidtoken), the key is a x509 public key whose private key is used to sign the JWT. According to the same document, the key could be retrieved by going to [https://www.googleapis.com/oauth2/v1/certs](https://www.googleapis.com/oauth2/v1/certs). Simple wget returned this.

```
{
  "5f1f4e771e997d21a08add83acbf18c6cb4e5473": "-----BEGIN CERTIFICATE-----\nMIICIDCCAYm..Mh+Y=\n-----END CERTIFICATE-----\n",
 "729d763c1d8254b3a7f8dd6df19edea7ca836b7b": "-----BEGIN CERTIFICATE-----\nMIICITCC...DeQG1z\n-----END CERTIFICATE-----\n"
}
```

There are two. Which one was used? Going back to the [JWT spec](https://metacpan.org/pod/JSON::WebToken) turned out that a "JWT is represented as a sequence of URL-safe parts separated by period (".") characters". And after also reading through the code of the cpan module, I tried to decode the first part of MIME encoded JWT.


```
1> x MIME::Base64::decode_base64( substr( $id_token, 0, index( $id_token, '.' ) ) );
{"alg":"RS256","kid":"5f1f4e771e997d21a08add83acbf18c6cb4e5473"}
```

Yeah, the "kid" is what I just saw in the JSON returned from /certs endpoint from Google. This should be what $key should have.

```
2> $key = "-----BEGIN CERTIFICATE-----\nMIICIDCCAYm..Mh+Y=\n-----END CERTIFICATE-----\n",
3> x JSON::WebToken->decode($id_token, $key);
unrecognized key format
```

Oh cpan module, how I &hellip;. what?

Fast forward what really happened during my struggle to find it out, it turned out that the error was from [Crypt::OpenSSL::RSA](http://api.metacpan.org/source/PERLER/Crypt-OpenSSL-RSA-0.28/RSA.pm), because it doesn't accept a certificate, but does a public key. Of course. Simple openssl command should give it to me.

```
$ openssl x509 -pubkey
-----BEGIN CERTIFICATE-----
MIICIDCCAYm
...
Mh+Y=
-----END CERTIFICATE-----
-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQE
...
```

Giving this public key as $key finally gave me what I wanted.

```
$VAR1 = {
  'exp' => 1390759437,
 'iss' => 'accounts.google.com',
'openid_id' => 'https://www.google.com/accounts/o8/id?id=AItOawkFEXN4pg8u52IM_YLN86LIolXUxqKrU3M',
'sub' => '11843998...',
 'azp' => '...',
 'iat' => 1390755537,
...
 };
```

Aaaahhhh, it was about 3 hours of writing code, reading documents, experimenting and failing and starting over, but here I got my OpenID ident by logging in through Google+ Sign In. With this and "sub" key, Peatix can now find an account associated to an Google account no matter if the user was created by our OpenID implementation before, or by the new Google+ implementation.

Finally, **big kudos to Google**. Google does a good job of supporting long-time users of their API backend. Seriously, it was really easy in the end, after I was able to decode the statement "data-openidrealm is what you need" to something like

```
"Yeah, Google should not have implemented two separate code in order to support both Hybrid and Pure server flow; that means I should be able to specify this "openidrealm" somewhere in my pure OAuth2 code."
```


After decoding the statement to something like that, I was able to find other mentions to openid.realm in their documents, which told me how to do Pure server-side OpenID migration.

