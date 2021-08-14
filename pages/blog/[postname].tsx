import { GetStaticProps, GetStaticPaths } from "next"
import Head from "next/head"
import matter from "gray-matter"
import ReactMarkdown from "react-markdown"
import gfm from 'remark-gfm'
import styles from "../../styles/BlogPost.module.css"
import { dateString } from "../../util"
import { ElementType } from "react"
import Link from "next/link"

export default function BlogPost({ frontmatter, markdownBody, navs }) {
  if (!frontmatter) return <></>

  const renderers: { [nodeType: string]: ElementType<any>; } = {
    img: props =>
      /\/videos\//.test(props.src)
        ? (
          <div className="image-container">
            <video src={props.src} title={props.alt} controls muted />
            <div className="image-caption">{props.alt}</div>
          </div>
        )
        : (
          <div className="image-container">
            <img src={props.src} alt={props.alt} />
            <div className="image-caption">{props.alt}</div>
          </div>
        ),
    p: "div",
    table: props => <table className="blog-post-table">{props.children}</table>,
  }

  return (
    <>
      <Head>
        <title>{frontmatter.title}</title>
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:site" content="@fumiakiy" />
        <meta name="og:title" content={frontmatter.title} />
        <meta name="twitter:title" content={frontmatter.title} />
        {
          !!frontmatter.excerpt
            ? <meta name="description" content={frontmatter.excerpt} />
            : null
        }
        {
          !!frontmatter.excerpt
            ? <meta name="og:description" content={frontmatter.excerpt} />
            : null
        }
        {
          !!frontmatter.excerpt
            ? <meta name="twitter:description" content={frontmatter.excerpt} />
            : null
        }
        {
          !!frontmatter.ogImage
            ? <meta property="og:image" content={`https://luckypines.com${frontmatter.ogImage}`} />
            : null
        }
        {
          !!frontmatter.ogImage
            ? <meta property="twitter:image" content={`https://luckypines.com${frontmatter.ogImage}`} />
            : null
        }
        {
          navs.prevPage == null
            ? null
            : <link rel="prev" href={`https://luckypines.com${navs.prevPage.slug}`} />
        }
        {
          navs.nextPage == null
            ? null
            : <link rel="next" href={`https://luckypines.com${navs.nextPage.slug}`} />
        }
      </Head>
      <div className="blog">
        <article className={styles.article}>
          <h1>{frontmatter.title}</h1>
          <div className={styles.date}>{dateString(frontmatter.epoch)}</div>
          <div className={styles.body}>
            <ReactMarkdown children={markdownBody} remarkPlugins={[gfm]} components={renderers} />
          </div>
        </article>
      </div>
      <footer className={styles.footer}>
        {
          navs.prevPage == null
            ? null
            : <Link href={{ pathname: `${navs.prevPage.slug}` }}><a className={styles.prev}>&laquo; {navs.prevPage.title}</a></Link>
        }
        <Link href={{ pathname: "/blog" }}><a className={styles.top}>Blog</a></Link>
        {
          navs.nextPage == null
            ? null
            : <Link href={{ pathname: `${navs.nextPage.slug}` }}><a className={styles.next}>{navs.nextPage.title} &raquo; </a></Link>
        }
      </footer>
    </>
  )
}

function findPostsAround(postname: string) {
  const posts = ((context) => {
    const keys = context.keys()
    const values = keys.map(context)
    return values.map((value:any) => {
      const document = matter(value.default)
      return {
        epoch: document.data.epoch,
        title: document.data.title,
        slug: document.data.slug
      }
    }).sort((a, b) => b.epoch.localeCompare(a.epoch))
  })(require.context("../../posts", true, /\.md$/))

  if (posts.length <= 0) return {}
  const thisPageIndex = posts.findIndex(p => p.slug === `/blog/${postname}`)
  return {
    nextPage: posts[thisPageIndex - 1] ?? null,
    prevPage: posts[thisPageIndex + 1] ?? null
  }
}

export const getStaticProps: GetStaticProps = async (context) => {
  const { postname } = context.params
  const navs = findPostsAround(postname as string)

  const content = await import(`../../posts/${postname}.md`)
  const data = matter(content.default)

  return {
    props: {
      frontmatter: data.data,
      markdownBody: data.content,
      navs: navs
    },
  }
}

export const getStaticPaths: GetStaticPaths = async () => {
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