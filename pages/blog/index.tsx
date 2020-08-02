import matter from "gray-matter"
import Head from "next/head"
import Link from "next/link"

import styles from "../../styles/BlogIndex.module.css"

interface Post {
  frontmatter: {
    date: string
    epoch: string
    slug: string
    title: string
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
        <h1 className={styles.heading}>Blog</h1>
        <Posts posts={posts} />
      </main>
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
                  post.markdownBody.length > 200
                     ? `${post.markdownBody.substring(0, 200)}...`
                     : post.markdownBody
                }
              </div>
              <div className={styles.date}>{post.frontmatter.date}</div>
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
    const data = values.map(value => {
      const document = matter(value.default)
      return {
        frontmatter: document.data,
        markdownBody: document.content
      }
    }).sort((a, b) => b.frontmatter.epoch - a.frontmatter.epoch)
    return data
  })(require["context"]('../../posts', true, /\.md$/))

  return {
    props: {
      posts
    },
  }
}

export default BlogIndex