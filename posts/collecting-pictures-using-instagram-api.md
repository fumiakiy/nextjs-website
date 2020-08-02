---
slug: "/blog/collecting-pictures-using-instagram-api"
date: "Sun, 02 Feb 2014 20:33:00 GMT"
title: "Collecting pictures using Instagram API"
epoch: "1391373180"
---


Instagram has an API. That’s good. But its document was a little bit confusing to me. This is how I ended up implementing Perl code that populates Instagram pictures that have a hashtag of my interest.

First confusion - is authentication required or not?
----------------------------------------------------

To get information of pictures with a hashtag, Instagram API offers “Tag” endpoints. [The document about Tag endpoint](http://instagram.com/developer/endpoints/tags/)s says though it requires authentication, thus requires access_token parameter. But wait, whose access_token does it require, when all I want is information about publicly viewable photos with a hashtag?

I thought it didn’t make sense to give my own access_token that does work on behalf of my own user account. Or any user account. My intention was to implement a backend service that works periodically to collect pictures with certain hashtags. I just ignored the document and just gave my app’s client_id that I generated on Instagram console. As expected, it worked.

### Point #1: you probably don’t need access_token and all of those pita steps to get OAuth2 access token from a user account.

Second confusion: how do I paginate the results to get more results?
--------------------------------------------------------------------

Twitter API does a great job by offering since_id and max_id parameters, so we as a client developer doesn’t have to consider duplicated tweets from two result sets from API calls. [Twitter documentation about “Working with Timelines”](https://dev.twitter.com/docs/working-with-timelines) is really well written and easy to understand what we should do.

Since Instagram offers same type of data that is a stream of posts ordered by pictures posted descending, it has similar pagination parameters; it is only more confusing.

Instagram API names those paramters as max_tag_id and min_tag_id. [Instagram API also returns “pagination” meta data](http://instagram.com/developer/endpoints/#pagination) in API results, which has “next_url” value which looks something like this

[https://api.instagram.com/v1/tags/puppy/media/recent?client_id=xxx&max_tag_id=1391400658711](https://api.instagram.com/v1/tags/puppy/media/recent?client_id=xxx&max_tag_id=1391400658711)

It also carries two more important values

```
{  
    "next_max_tag_id":"1391400658711",  
    "min_tag_id":"1391400689156"  
}
```

Calling the API by using the next_url value (note that it has the same id as next_max_tag_id has) returns the next set of results which carries the newest pictures whose id is less than max_tag_id.

As my goal is to get pictures periodically, storing next_max_tag_id for the next iteration doesn’t make sense because specifying that value narrows down the results to something that I always have collected.

So, I rather stored min_tag_id and called the API next time with something like 

[https://api.instagram.com/v1/tags/puppy/media/recent?client_id=xxx&min_tag_id=1391400658711](https://api.instagram.com/v1/tags/puppy/media/recent?client_id=xxx&min_tag_id=1391400658711)

Unfortunately, this returned nothing. It was obvious after a few more experiments and scratching my head, that because what I wanted was pictures posted after the biggest id, but Instagram calls it “min_tag_id”! Instagram calls it small ids as “max”, or “next” when in fact it is actually about getting older data, instead of new data that I assumed.

So the final code of mine stores the “min_tag_id” in the database for the next iteration, and calls the API with min_tag_id=<stored min_tag_id>, to avoid getting data that is already in our database.

### Point #2: “max” and “next” could mean different things to different heads.

In my humble opinion though, Twitter API does smarter job here as it called those parameters as since_id and max_id, less confusing at least to me.

