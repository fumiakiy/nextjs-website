import Head from 'next/head'
import Link from "next/link"
import matter from "gray-matter"
import ReactMarkdown from "react-markdown"

export default function BlogPost({ frontmatter, markdownBody }) {
  if (!frontmatter) return <></>

  return (
    <>
      <Head>
        <title>{frontmatter.title}</title>
        <meta name="description" content="{formatter.body}" />
      </Head>
      <Link href="/blog">
        <a>Back to post list</a>
      </Link>
      <article>
        <h1>{frontmatter.title}</h1>
        <div>
          <ReactMarkdown source={markdownBody} />
        </div>
      </article>
    </>
  )
}

export async function getStaticProps({ ...ctx }) {
  const { postname } = ctx.params

  const content = await import(`../../posts/${postname}.md`)
  const data = matter(content.default)

  return {
    props: {
      frontmatter: data.data,
      markdownBody: data.content,
    },
  }
}

export async function getStaticPaths() {
  const blogSlugs = ((context) => {
    const keys = context.keys()
    const data = keys.map((key, index) => {
      let slug = key.replace(/^.*[\\\/]/, "").slice(0, -3)

      return slug
    })
    return data
  })(require.context("../../posts", true, /\.md$/))

  const paths = blogSlugs.map((slug) => `/blog/${slug}`)

  return {
    paths,
    fallback: false,
  }
}