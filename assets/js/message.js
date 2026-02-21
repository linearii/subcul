(() => {
  const supabaseUrl = "https://lyuzrjjencnsrlriiuun.supabase.co";
  const supabaseKey = "sb_publishable_fAXQPljGbau845yVYzx5mw_1Ckm-HqA";
  const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

  const form = document.getElementById("message-form");
  const messagesList = document.getElementById("messages-list");

  let lastSubmitTime = 0;

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function renderMessage(msg, prepend = false) {
    const div = document.createElement("div");
    div.className = "message-item";
    div.innerHTML = `
      <div class="message-meta">
        <strong>${escapeHtml(msg.nickname)}</strong>
        • ${new Date(msg.created_at).toLocaleString()}
      </div>
      <div class="message-content">
        ${escapeHtml(msg.content)}
      </div>
    `;

    if (prepend) {
      messagesList.prepend(div);
    } else {
      messagesList.appendChild(div);
    }
  }

  async function loadMessages() {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    messagesList.innerHTML = "";
    data.forEach(msg => renderMessage(msg));
  }

  // 실시간 구독
  supabase
    .channel("messages-realtime")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages" },
      payload => {
        renderMessage(payload.new, true);
      }
    )
    .subscribe();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const now = Date.now();

    // ⛔ 1. 허니팟 체크 (봇 방지)
    if (document.getElementById("website").value !== "") {
      return;
    }

    // ⛔ 2. 최소 시간 제한 (3초)
    if (now - lastSubmitTime < 3000) {
      alert("Please wait a few seconds before posting again.");
      return;
    }

    lastSubmitTime = now;

    const nickname = document.getElementById("nickname").value.trim();
    const content = document.getElementById("content").value.trim();

    if (!nickname || !content) return;

    const { error } = await supabase
      .from("messages")
      .insert([{ nickname, content }]);

    if (error) {
      alert("Error posting message");
      console.error(error);
      return;
    }

    form.reset();
  });

  loadMessages();
})();