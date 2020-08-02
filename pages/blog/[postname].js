import Head from 'next/head'
import matter from "gray-matter"
import ReactMarkdown from "react-markdown"

import styles from "../../styles/BlogPost.module.css"

export default function BlogPost({ frontmatter, markdownBody }) {
  if (!frontmatter) return <></>

  return (
    <>
      <Head>
        <title>{frontmatter.title}</title>
        <meta name="description" content="{formatter.body}" />
      </Head>
      <div className="blog">
        <article className={styles.article}>
          <h1>{frontmatter.title}</h1>
          <div className={styles.body}>
            <ReactMarkdown source={markdownBody} />
          </div>
        </article>
      </div>
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