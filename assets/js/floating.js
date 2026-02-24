document.addEventListener("DOMContentLoaded", function () {
  const STORAGE_KEY = "collagePositions";

  const items = document.querySelectorAll(".collage-item");

  // 🔹 저장된 위치 불러오기
  const savedPositions = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};

  items.forEach(item => {

    const id = item.dataset.id;
    if (!id) return;

    // 🔥 저장값이 있으면 덮어쓰기
    if (savedPositions[id]) {
      item.style.left = savedPositions[id].x + "px";
      item.style.top = savedPositions[id].y + "px";
    }

    // 브라우저 기본 링크 드래그 방지
    item.setAttribute("draggable", "false");
    item.addEventListener("dragstart", e => e.preventDefault());

    let isDragging = false;
    let moved = false;
    let offsetX = 0;
    let offsetY = 0;

    const DRAG_THRESHOLD = 5;

    const startDrag = (clientX, clientY) => {
      isDragging = true;
      moved = false;

      const rect = item.getBoundingClientRect();
      offsetX = clientX - rect.left;
      offsetY = clientY - rect.top;

      item.style.cursor = "grabbing";
      item.style.zIndex = Date.now();
    };

    const duringDrag = (clientX, clientY) => {
      if (!isDragging) return;

      const canvasRect = item.parentElement.getBoundingClientRect();

      const newX = clientX - canvasRect.left - offsetX;
      const newY = clientY - canvasRect.top - offsetY;

      if (Math.abs(newX - item.offsetLeft) > DRAG_THRESHOLD ||
          Math.abs(newY - item.offsetTop) > DRAG_THRESHOLD) {
        moved = true;
      }

      item.style.left = newX + "px";
      item.style.top = newY + "px";
    };

    const endDrag = () => {
      if (!isDragging) return;

      isDragging = false;
      item.style.cursor = "grab";

      if (moved) {
        savePosition(id, item);
      }
    };

    function savePosition(id, element) {
      const positions = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
      positions[id] = {
        x: parseInt(element.style.left),
        y: parseInt(element.style.top)
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
    }

    // Mouse
    item.addEventListener("mousedown", e => {
      e.preventDefault();
      startDrag(e.clientX, e.clientY);
    });

    document.addEventListener("mousemove", e => {
      duringDrag(e.clientX, e.clientY);
    });

    document.addEventListener("mouseup", endDrag);

    // Touch
    item.addEventListener("touchstart", e => {
      const touch = e.touches[0];
      startDrag(touch.clientX, touch.clientY);
    });

    document.addEventListener("touchmove", e => {
      if (!isDragging) return;
      const touch = e.touches[0];
      duringDrag(touch.clientX, touch.clientY);
    }, { passive: false });

    document.addEventListener("touchend", endDrag);

    // 클릭 방지
    item.addEventListener("click", function (e) {
      if (moved) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    });

    document.addEventListener("click", function(e) {
      if (e.target.id === "collage-reset-btn") {
        localStorage.removeItem(STORAGE_KEY);
        location.reload();
      }

      if (e.target.id === "collage-debug-btn") {
        dumpCollagePositions();
      }
    });

    function dumpCollagePositions() {
      const items = document.querySelectorAll('.collage-item');
      const result = {};

      items.forEach(item => {
        const id = item.dataset.id;
        if (!id) return;

        const x = parseFloat(item.style.left) || 0;
        const y = parseFloat(item.style.top) || 0;

        // rotation 추출
        let rotation = 0;
        const transform = item.style.transform;
        if (transform && transform.includes('rotate')) {
          const match = transform.match(/rotate\(([-\d.]+)deg\)/);
          if (match) rotation = parseFloat(match[1]);
        }

        result[id] = {
          x,
          y,
          rotation
        };
      });

      console.log(result);
    }
  });
});