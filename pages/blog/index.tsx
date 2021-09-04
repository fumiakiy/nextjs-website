import matter from "gray-matter"
import Head from "next/head"
import Link from "next/link"
import styles from "../../styles/BlogIndex.module.css"
import { dateString } from "../../util"

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

const BlogIndex = ({ posts, ...props }) => {
  return (
    <>
      <Head>
        <title>Blog | Fumiaki Yoshimatsu</title>
      </Head>
      <main>
        <a href="/" className={styles.backlink}>https://luckypines.com</a>
        <h1 className={styles.heading}>Blog</h1>
        <Posts posts={posts} />
      </main>
      <footer className={styles.footer}>
        <a href="/" className={styles.backlink}>https://luckypines.com</a>
      </footer>
    </>
  )
}

function Posts(props: PostsProps) {
  return (<ul className={styles.list}>
    {
      props.posts.map(post =>
        <li key={post.frontmatter.epoch} className={styles.card}>
          <Link href={{ pathname: `${post.frontmatter.slug}` }}>
            <div className={styles.cardContent}>
              <h2 className={styles.title}>{post.frontmatter.title}</h2>
              <div className={styles.excerpt}>
                {
                  !!post.frontmatter.excerpt
                    ? post.frontmatter.excerpt
                    : post.markdownBody.length > 200
                      ? `${post.markdownBody.substring(0, 200)}...`
                      : post.markdownBody
                }
              </div>
              <div className={styles.date}>{dateString(post.frontmatter.epoch)}</div>
            </div>
          </Link>
        </li>
      )
    }
  </ul>)
}

export async function getStaticProps() {
  const posts = ((context) => {
    const keys = context.keys()
    const values = keys.map(context)
    const data = values.reduce<any>((c, v) => {
      const document = matter(v["default"])
      if (!!document.data.draft) return c
      c.push({
        frontmatter: document.data,
        markdownBody: document.content
      })
      return c
    }, []).sort((a, b) => b.frontmatter.epoch - a.frontmatter.epoch)
    return data
  })(require["context"]('../../posts', true, /\.md$/))

  return {
    props: {
      posts
    },
  }
}

export default BlogIndex