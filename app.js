const noButton = document.querySelector("#no-button");
const dialog = document.querySelector("#dialog");
const dialogMessage = document.querySelector("#dialog-message");
const dialogClose = document.querySelector("#dialog-close");

const reconsiderMessages = [
  "要不要再给我一次机会？我会用行动证明我的认真。",
  "再想一小会儿嘛，我真的很想成为那个陪着你的人。",
  "你的这个答案，我想申请一次重新考虑的机会。",
  "不如先点一次“同意”试试看？以后的甜，我慢慢补给你。",
  "我还是想再认真问一遍：晓雨，可以给我一个机会吗？",
];

let messageIndex = 0;

if (noButton && dialog && dialogMessage && dialogClose) {
  noButton.addEventListener("click", () => {
    dialogMessage.textContent = reconsiderMessages[messageIndex];
    messageIndex = (messageIndex + 1) % reconsiderMessages.length;
    dialog.hidden = false;
    dialogClose.focus();
  });

  dialogClose.addEventListener("click", () => {
    dialog.hidden = true;
    noButton.focus();
  });
}
