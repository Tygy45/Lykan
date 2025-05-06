import config
import logging
import asyncio
from aiogram import Bot, Dispatcher, F
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, FSInputFile, InputMediaPhoto
from base import SQL
from datetime import datetime
#from PIL import Image


# Настройка базы данных и бота
db = SQL('db.db')
bot = Bot(token=config.TOKEN)
dp = Dispatcher()

logging.basicConfig(level=logging.INFO)

photo1 = FSInputFile('images/main.jpg')
mainPhoto = InputMediaPhoto(media=photo1, caption=f'Главное меню1')

# Главное меню
kb_main = InlineKeyboardMarkup(inline_keyboard=[
    [InlineKeyboardButton(text="Посмотреть все товары", callback_data="list")],
    [InlineKeyboardButton(text="Моя корзина", callback_data="basket")],
    [InlineKeyboardButton(text="Мои заказы", callback_data="orders")],
    [InlineKeyboardButton(text="Сделать покупку", callback_data="buy")],
    [InlineKeyboardButton(text="Пополнить баланс (+100)", callback_data="up_balance")]
])

# Меню администратора
kb_admin = InlineKeyboardMarkup(inline_keyboard=[
    [InlineKeyboardButton(text="Добавить товар", callback_data="add")]
])

# Меню назад
kb_back = InlineKeyboardMarkup(inline_keyboard=[
    [InlineKeyboardButton(text="Назад", callback_data="back")]
])

def resize_image(image_path):
    # Открываем изображение
    with Image.open(image_path) as img:
        # Сжимаем изображение до 300x300
        img = img.resize((300, 300))
        # Сохраняем изображение с тем же именем, перезаписывая оригинал
        img.save(image_path)

# Вспомогательная функция для обработки кнопок корзины
def get_basket_buttons(id_item, count, k):
    kb = []
    if count > 0:
        kb = [
            [InlineKeyboardButton(text="-", callback_data=f"minus_{id_item}"),
             InlineKeyboardButton(text=f"{count}", callback_data="number"),
             InlineKeyboardButton(text="+", callback_data=f"plus_{id_item}")]
            ]
    else:
        kb.append([InlineKeyboardButton(text="Добавить в корзину", callback_data=f"add_{id_item}")])
    if k == 0:
        kb.append(
            [InlineKeyboardButton(text="---", callback_data="-"),
             InlineKeyboardButton(text="→", callback_data="next")])
    elif k == -1:
        kb.append(
            [InlineKeyboardButton(text="←", callback_data="prev"),
             InlineKeyboardButton(text="---", callback_data="-")])
    else:
        kb.append(
            [InlineKeyboardButton(text="←", callback_data="prev"),
             InlineKeyboardButton(text="→", callback_data="next")])
    kb.append([InlineKeyboardButton(text="Назад", callback_data="back")])
    return kb

#статусы пользователя
# 0 - статус покоя
# 1 -
# 2 -
# 3 -
# 4 -
# 5 - введи название товара
# 6 - введи цену
# 7 - отправь фото
#статусы заказа
# 0 - в корзине
# 1 - заказан

#временные переменные для добавления товара
name = ''
price = 0

@dp.message(F.photo)
async def photo_handler(message):
    """Обработка загрузки фото товара."""
    global name, price
    id_user = message.from_user.id
    if db.get_field("users", id_user, "status") == 7:
        db.add_item(name, price)
        id_item = db.get_id_item(name)
        await message.answer("Товар успешно добавлен!")
        path = f"images/{id_item}.png"
        await bot.download(message.photo[-1], destination= path)
        resize_image(path)
        db.update_field("users", id_user, "status", 0)

@dp.message()
async def start(message):
    """Обработка текстовых сообщений."""
    global name, price
    id_user = message.from_user.id
    if not db.user_exist(id_user):
        db.add_user(id_user)
    status = db.get_field("users", id_user, "status")
    admin = db.get_field("users", id_user, "admin")
    if not admin:
        await bot.send_photo(message.chat.id, photo1, caption="Главное меню:", reply_markup=kb_main)
        return
    if status == 5:
        name = message.text
        db.update_field("users", id_user, "status", 6)
        await message.answer("Введите цену товара!")
        return
    elif status == 6:
        try:
            price = float(message.text)
            await message.answer("Отправьте фото товара!")
            db.update_field("users", id_user, "status", 7)
        except ValueError:
            await message.answer("Пожалуйста, введите корректную цену (число).")
        return
    await bot.send_photo(message.chat.id, photo1, caption="Меню администратора:", reply_markup=kb_admin)



@dp.callback_query()
async def callback_handler(call):
    """Обработка нажатий на кнопки."""
    id_user = call.from_user.id
    if not db.user_exist(id_user):
        db.add_user(id_user)

    if call.data == "basket":
        items = db.get_orders(id_user, 0)
        if not items:
            await call.answer("Ваша корзина пуста!")
            return
        for item in items:
            count = item[3]
            buttons_item = get_basket_buttons(item[1], count)
            kb_item = InlineKeyboardMarkup(inline_keyboard=buttons_item)
            await call.message.answer(f"Название: {item[6]}\nЦена: {item[7]}", reply_markup=kb_item)
    elif call.data == "orders":
        items = db.get_orders(id_user, 1)
        if not items:
            await call.answer("Вы ещё ничего не заказывали!")
            return
        text = ''
        for item in items:
            text += f"ID: {item[0]} Название: {item[6]}\nЦена: {item[7]}\nКоличество: {item[3]}\nДата покупки: {item[5]}"
            await call.message.edit_text(text, reply_markup=kb_back)
    elif call.data == "up_balance":
        balance = db.get_field("users", id_user, "balance") or 0
        balance += 100
        db.update_field("users", id_user, "balance", balance)
        await call.answer(f"Ваш новый баланс: {balance}")
    elif call.data == "buy":
        basket = db.get_orders(id_user, 0)
        if not basket:
            await call.answer("Ваша корзина пуста!")
            return
        total_cost = sum(item[3] * item[7] for item in basket)
        balance = db.get_field("users", id_user, "balance") or 0
        if balance < total_cost:
            await call.answer(f"Недостаточно средств! Итоговая сумма: {total_cost}")
            return
        #если денег хватает
        db.update_field("users", id_user, "balance", balance - total_cost)
        for item in basket:
            id_item = item[0]
            current_time = datetime.now()
            formatted_time = current_time.strftime("%d.%m.%Y %H:%M")
            db.update_field('orders', id_item, 'status',1)
            db.update_field('orders', id_item, 'date', formatted_time)
        await call.answer(f"Покупка совершена! Итоговая сумма: {total_cost}")
    elif call.data == "back":
        await bot.edit_message_media(chat_id=call.message.chat.id,
                               message_id=call.message.message_id,
                               media=mainPhoto, reply_markup=kb_main)
    elif call.data == "add":
        await call.answer("Введите название товара.")
        db.update_field("users", id_user, "status", 5)
    elif call.data == "list":
        items = db.get_items_by_status(1)
        if not items:
            await call.answer("Нет доступных товаров!")
            return
        db.update_field('users', id_user, 'spisok', 0)
        k=0
        item = items[k]
        id_item, name, price = item[0], item[1], item[2]
        count = db.get_count(id_item, id_user, 0)
        if k<len(items):
            buttons_item = get_basket_buttons(id_item, count, k)
        else:
            buttons_item = get_basket_buttons(id_item, count, -1)
        kb_item = InlineKeyboardMarkup(inline_keyboard=buttons_item)
        image = FSInputFile(f"images/{id_item}.png")
        content_image = InputMediaPhoto(media=image, caption=f"Название: {name}\nЦена: {price}")
        await bot.edit_message_media(chat_id=call.message.chat.id,
                                     message_id=call.message.message_id,
                                     media=content_image, reply_markup=kb_item)
    elif call.data == "next":
        items = db.get_items_by_status(1)
        if not items:
            await call.answer("Нет доступных товаров!")
            return
        k=db.get_field('users', id_user, 'spisok') + 1
        db.update_field('users', id_user, 'spisok', k)
        item = items[k]
        id_item, name, price = item[0], item[1], item[2]
        count = db.get_count(id_item, id_user, 0)
        if k<len(items):
            buttons_item = get_basket_buttons(id_item, count, k)
        else:
            buttons_item = get_basket_buttons(id_item, count, -1)
        kb_item = InlineKeyboardMarkup(inline_keyboard=buttons_item)
        image = FSInputFile(f"images/{id_item}.png")
        content_image = InputMediaPhoto(media=image, caption=f"Название: {name}\nЦена: {price}")
        await bot.edit_message_media(chat_id=call.message.chat.id,
                                     message_id=call.message.message_id,
                                     media=content_image, reply_markup=kb_item)
    await bot.answer_callback_query(call.id)


async def main():
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
