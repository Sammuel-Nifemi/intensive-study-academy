
const container = document.getElementById("dynamicBlogPosts");

async function loadBlogs() {
  try {
    const res = await fetch("http://localhost:5000/api/blogs");
    const posts = await res.json();

    container.innerHTML = "";

    if (!posts.length) {
      container.innerHTML = "<p>No updates yet.</p>";
      return;
    }

    posts.forEach(post => {
      const article = document.createElement("article");
      article.className = "blog-card";

      article.innerHTML = `
        <h3>${post.title}</h3>
        <p>${post.content}</p>
      `;

      container.appendChild(article);
    });
  } catch {
    container.innerHTML = "<p>Unable to load updates.</p>";
  }
}

loadBlogs();
