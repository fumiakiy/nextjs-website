import matter from "gray-matter"
import * as fs from "fs"
import { dateStringISO } from "../../util"

interface Post {
  frontmatter: {
    date: string
    epoch: string
    slug: string
    title: string
    excerpt: string
  }
  markdownBody: string
}

interface PostsProps {
  posts: Post[]
}

function FeedEnvelope(props: PostsProps) {
  return `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Blog by Fumiaki Yoshimatsu</title>
  <link href="https://luckypines.com/blog"/>
  <updated>${dateStringISO(props.posts[0].frontmatter.epoch)}</updated>
  <author>
    <name>Fumiaki Yoshimatsu</name>
  </author>
  <id>urn:uuid:04aa0189-25c9-422b-b6a0-af7b9eb962df</id>
  ${props.posts.map(feedItem).join("")}
</feed>
`
}

const feedItem = (post: Post): string => `
<entry>
  <title>${post.frontmatter.title}</title>
  <link href="https://luckypines.com${post.frontmatter.slug}"/>
  <id>urn:uuid:1225c695-cfb8-4ebb-aaaa-80da344efa6a</id>
  <updated>${dateStringISO(post.frontmatter.epoch)}</updated>
  <summary>${!!post.frontmatter.excerpt
    ? post.frontmatter.excerpt
    : post.markdownBody.length > 200
      ? `${post.markdownBody.substring(0, 200)}...`
      : post.markdownBody
  }</summary>
</entry>
`

export async function getStaticProps() {
  const allPosts = ((context) => {
    const keys = context.keys()
    const values = keys.map(context)
    const data = values.map((value:any) => {
      const document = matter(value.default)
      return {
        frontmatter: document.data,
        markdownBody: document.content
      } as Post
    }).sort((a, b) => b.frontmatter.epoch.localeCompare(a.frontmatter.epoch))
    return data
  })(require["context"]("../../posts", true, /\.md$/))

  const posts: Post[] = allPosts.filter(p => p.frontmatter.epoch > "1500262000")
  const atom = FeedEnvelope({posts: posts});

  fs.writeFileSync("./public/feed.atom", atom);

  return {
    props: {
      posts
    },
  }
}

export default FeedEnvelope