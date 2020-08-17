import Head from "next/head"
import styles from "../styles/Home.module.css"

export default function Home() {
  return (<>
    <Head>
      <title>Fumiaki Yoshimatsu</title>
      <meta name="description" content="A software engineer in NYC" />
    </Head>
    <div className={styles.root}>
      <div className={styles.container}>
        <h1>Hello, I'm Fumiaki Yoshimatsu.</h1>
        <div className={styles.content}>
          <div className={styles.avatar}>
          <img src="/profile.jpg" />
          </div>
          <ul className={styles.links}>
            <li><a href="https://github.com/fumiakiy">GitHub</a></li>
            <li><a href="https://twitter.com/fumiakiy">Twitter</a></li>
            <li><a href="/blog">Blog</a></li>
            <li><a href="https://linkedin.com/in/fumiakiy">LinkedIn</a></li>
            <li><a href="resume.html">Resume</a></li>
          </ul>
        </div>
      </div>
    </div>
  </>)
}
