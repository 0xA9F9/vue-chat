
# ТЕСТ ЧАТ

### **Описание**  
Это приложение чата, созданное с использованием Vue.js и Firebase. Оно включает в себя базовые функции аутентификации и чат в реальном времени, поддерживаемый Firebase Realtime Database.

---

### **Функции**
- **Регистрация пользователей**  
  Возможность создать новый аккаунт.

- **Вход**  
  Пользователи могут входить в систему, используя email и пароль.

- **Сброс пароля**  
  Пользователи могут сбросить пароль по email в случае его утери.

- **Чат в реальном времени**  
  Пользователи могут отправлять и получать сообщения мгновенно.

---

### **Демо**  
[Посмотреть демо](https://piratechat.vercel.app)

---

### **Технологии**
- **Frontend:** Vue.js  
- **Backend:** Firebase (Realtime Database, Authentication)  
- **Инструмент сборки:** Vite  

---

### **Установка и настройка**

1. **Клонируйте репозиторий**  
```sh
git clone https://github.com/0xA9F9/chat.git
```

2. **Перейдите в папку проекта**  
```sh
cd chat
```

3. **Настройте Firebase**  
Файл `src/firebase.js` уже содержит тестовую конфигурацию Firebase.  
Для production создайте собственный проект в [Firebase Console](https://console.firebase.google.com), добавьте веб-приложение и замените конфигурацию.

Пример конфигурации:
```js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
    apiKey: "Ваш API ключ",
    authDomain: "Ваш домен",
    databaseURL: "URL вашей базы данных",
    projectId: "ID вашего проекта",
    storageBucket: "Ваш storage bucket",
    messagingSenderId: "Ваш ID отправки сообщений",
    appId: "Ваш ID приложения",
    measurementId: "Ваш ID аналитики"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app); 
```

4. **Установите правила безопасности Firebase**  
Для корректной работы приложения установите следующие правила безопасности в Firebase Realtime Database:
```json
{
  "rules": {
    "users": {
      ".read": "auth != null",
      "$uid": {
        ".write": "$uid === auth.uid",
        ".validate": "newData.hasChildren(['nickname', 'avatar'])",
        "nickname": {
          ".validate": "newData.isString() && newData.val().length > 0"
        },
        "avatar": {
          ".validate": "newData.isString() && newData.val().matches(/^https?:\/\/.+/)"
        }
      }
    },
    "nicknames": {
      ".read": "true",
      ".write": "auth != null",
      "$nickname": {
        ".validate": "newData.isString() && newData.val() === auth.uid"
      }
    },
    "admins": {
      ".read": "auth != null",
      ".write": "auth != null && root.child('admins').child(auth.uid).exists()"
    },
    "messages": {
      ".read": "auth != null",
      ".indexOn": ["timestamp"],
      "$messageId": {
        ".write": "auth != null && (
          (!data.exists() && newData.child('uid').val() === auth.uid) ||
          (data.exists() && (
            root.child('admins').child(auth.uid).exists() ||
            data.child('uid').val() === auth.uid
          ))
        )",
        "uid": {
          ".validate": "newData.isString() && newData.val() === auth.uid"
        },
        "user": {
          ".validate": "newData.isString() && (!data.exists() || newData.val() === data.child('user').val())"
        },
        "avatar": {
          ".validate": "newData.isString() && (!data.exists() || newData.val() === data.child('avatar').val())"
        },
        "text": {
          ".validate": "newData.isString() && newData.val().length > 0"
        },
        "timestamp": {
          ".validate": "newData.isNumber()"
        },
        "replyTo": {
          ".validate": "newData.exists() ? newData.isString() : true"
        }
      }
    }
  }
}
```

5. **Установка и запуск**  
```sh
npm install
npm run build
npm run dev
```

---

### **Структура проекта**
```
├── dist/              # Выходные файлы production сборки
│   ├── assets/        # Стили и скрипты
│   └── index.html     # Основной HTML файл
├── index.html         # Стартовая страница для разработки
├── package.json       # Список зависимостей
├── server.js          # Серверный файл Node.js 
├── src/               # Исходный код приложения
│   ├── App.vue        # Главный компонент Vue
│   ├── alert.js       # Логика уведомлений
│   ├── components/    # Компоненты Vue
│   │   ├── ForgotPassword.vue # Страница сброса пароля
│   │   ├── Home.vue   # Главная страница чата
│   │   ├── Login.vue  # Страница входа
│   │   └── Register.vue # Страница регистрации
│   ├── firebase.js    # Конфигурация Firebase
│   ├── main.js        # Точка входа Vue
│   ├── router.js      # Маршруты Vue Router
│   └── styles.css     # Стили приложения
├── vercel.json        # Конфигурация для Vercel
└── vite.config.js     # Конфигурация Vite
```
