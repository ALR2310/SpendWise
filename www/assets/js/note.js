document.addEventListener('deviceready', function () {
    const swipeouts = document.querySelectorAll('.swipeout');

    swipeouts.forEach(swipeout => {
        const swipeoutContent = swipeout.querySelector(".swipeout-content");
        const swipeoutActionsLeft = swipeout.querySelector(".swipeout-actions-left");
        const swipeoutActionsRight = swipeout.querySelector(".swipeout-actions-right");

        const leftActionsWidth = swipeoutActionsLeft ? swipeoutActionsLeft.offsetWidth : 0;
        const rightActionsWidth = swipeoutActionsRight ? swipeoutActionsRight.offsetWidth : 0;

        let startX = 0, currentTranslateX = 0, isSwiping = false;

        function startSwipe(clientX) {
            startX = clientX - currentTranslateX;
            isSwiping = true;
            swipeoutContent.style.transition = "none";
        }

        function moveSwipe(clientX) {
            if (!isSwiping) return;
            const translateX = clientX - startX;

            // Nếu không có swipeoutActionsLeft, chỉ cho phép trượt sang trái
            if ((swipeoutActionsLeft || translateX <= 0) &&
                (swipeoutActionsRight || translateX >= 0)) {
                swipeoutContent.style.transform = `translateX(${translateX}px)`;
                currentTranslateX = translateX;
            }
        }


        function endSwipe() {
            isSwiping = false;
            const threshold = swipeoutContent.offsetWidth * 0.2; //20% chiều dài của thẻ

            // Điều chỉnh lại các điều kiện để kiểm tra từng trường hợp cụ thể
            if (currentTranslateX > threshold) {
                currentTranslateX = swipeoutActionsLeft ? leftActionsWidth : 0;
            } else if (currentTranslateX < -threshold) {
                currentTranslateX = swipeoutActionsRight ? -rightActionsWidth : 0;
            } else {
                currentTranslateX = 0;
            }

            swipeoutContent.style.transition = "transform 0.3s ease";
            swipeoutContent.style.transform = `translateX(${currentTranslateX}px)`;
        }

        function handleTouch(e) {
            if (e.type == "touchstart") startSwipe(e.touches[0].clientX);
            else if (e.type == "touchmove") moveSwipe(e.touches[0].clientX);
            else if (e.type === "touchend") endSwipe();
        }

        const handleMouse = (e) => {
            if (e.type === "mousedown") startSwipe(e.clientX);
            else if (e.type === "mousemove") moveSwipe(e.clientX);
            else if (e.type === "mouseup") endSwipe();
        };

        swipeoutContent.addEventListener("touchstart", handleTouch);
        swipeoutContent.addEventListener("touchmove", handleTouch);
        swipeoutContent.addEventListener("touchend", handleTouch);
        swipeoutContent.addEventListener("mousedown", handleMouse);
        document.addEventListener("mousemove", handleMouse);
        document.addEventListener("mouseup", handleMouse);
    });
});