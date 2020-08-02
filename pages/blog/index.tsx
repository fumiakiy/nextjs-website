import matter from "gray-matter"
import Head from "next/head"
import Link from "next/link"

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
        <Posts posts={posts} />
      </main>
    </>
  )
}

function Posts(props: PostsProps) {
  return (<ul>
    {
      props.posts.map(post =>
        <li key={post.frontmatter.epoch}>
          <Link href={{ pathname: `${post.frontmatter.slug}` }}>
            <a>{post.frontmatter.title}</a>
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