const tg = window.Telegram.WebApp;

// Инициализация
tg.ready(); // Сообщает Telegram, что Mini App готов к использованию
const user = tg.initDataUnsafe.user;
console.log(user); // { id: 12345, first_name: "John", last_name: "Doe", username: "johndoe" }
tg.BackButton.show();
tg.BackButton.onClick(() => {
    tg.close(); // Закрыть Mini App
});
