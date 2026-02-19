const blogList = document.getElementById("blogList");

async function loadBlogs() {
  try {
    const res = await fetch("http://localhost:5000/api/blogs");
    const posts = await res.json();

    blogList.innerHTML = "";

    if (posts.length === 0) {
      blogList.innerHTML = "<p>No blog posts yet.</p>";
      return;
    }

    posts.forEach(post => {
      const div = document.createElement("div");
      div.innerHTML = `
        <h3>${post.title}</h3>
        <p>${post.content}</p>
        <hr />
      `;
      blogList.appendChild(div);
    });
  } catch (err) {
    blogList.innerHTML = "<p>Error loading blog posts.</p>";
  }
}

loadBlogs();
