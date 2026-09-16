const GITHUB_OWNER = "o0oS2";
const GITHUB_REPO = "Tinh-luong";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const token = env.GH_TOKEN;
    if (!token) {
      return new Response(JSON.stringify({ error: "Chưa cấu hình GH_TOKEN trong Secrets" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Đọc file từ GitHub
    async function getFile(path) {
      const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}?t=${Date.now()}`;
      const res = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "User-Agent": "Cloudflare-Worker",
          "Accept": "application/vnd.github.v3+json"
        }
      });
      if (res.status === 404) return { sha: null, data: null };
      if (!res.ok) throw new Error("Lỗi đọc file từ GitHub");
      const json = await res.json();
      const content = decodeURIComponent(escape(atob(json.content.replace(/\n/g, ""))));
      return { sha: json.sha, data: JSON.parse(content || "{}") };
    }

    // Ghi file lên GitHub
    async function saveFile(path, data, sha, msg) {
      const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`;
      const jsonStr = JSON.stringify(data, null, 2);
      const b64 = btoa(unescape(encodeURIComponent(jsonStr)));
      const res = await fetch(url, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "User-Agent": "Cloudflare-Worker",
          "Accept": "application/vnd.github.v3+json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: msg, content: b64, sha: sha || undefined })
      });
      return res.ok;
    }

    const url = new URL(request.url);
    const action = url.searchParams.get("action");

    try {
      // 1. Đăng ký tài khoản
      if (action === "register" && request.method === "POST") {
        const { username, password } = await request.json();
        const { sha, data } = await getFile("data/users.json");
        const users = data || {};
        if (users[username]) {
          return new Response(JSON.stringify({ error: "Tài khoản đã tồn tại" }), { status: 400, headers: corsHeaders });
        }
        users[username] = { password };
        const ok = await saveFile("data/users.json", users, sha, `Tạo tài khoản: ${username}`);
        return new Response(JSON.stringify({ ok }), { headers: corsHeaders });
      }

      // 2. Đăng nhập
      if (action === "login" && request.method === "POST") {
        const { username, password } = await request.json();
        const { data } = await getFile("data/users.json");
        const users = data || {};
        if (users[username] && users[username].password === password) {
          return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
        }
        return new Response(JSON.stringify({ error: "Sai tên đăng nhập hoặc mật khẩu" }), { status: 400, headers: corsHeaders });
      }

      // 3. Tải dữ liệu tháng riêng
      if (action === "load" && request.method === "GET") {
        const username = url.searchParams.get("user");
        const monthKey = url.searchParams.get("monthKey");
        const filePath = `data/timesheets/${username}/${monthKey}.json`;
        const { data } = await getFile(filePath);
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // 4. Lưu dữ liệu tháng riêng
      if (action === "save" && request.method === "POST") {
        const { username, monthKey, payload } = await request.json();
        const filePath = `data/timesheets/${username}/${monthKey}.json`;
        const { sha } = await getFile(filePath);
        const ok = await saveFile(filePath, payload, sha, `Lưu công: ${username} [${monthKey}]`);
        return new Response(JSON.stringify({ ok }), { headers: corsHeaders });
      }

      return new Response("Not Found", { status: 404, headers: corsHeaders });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
    }
  }
};
