import sqlite3

class SQL:
    def __init__(self, database):
        self.connection = sqlite3.connect(database)
        self.cursor = self.connection.cursor()

    # Универсальные методы
    def get_field(self, table, id, field):
        query = f"SELECT {field} FROM {table} WHERE id = ?"
        with self.connection:
            result = self.cursor.execute(query, (id,)).fetchone()
            return result[0] if result else None

    def update_field(self, table, id, field, value):
        query = f"UPDATE {table} SET {field} = ? WHERE id = ?"
        with self.connection:
            self.cursor.execute(query, (value, id))

    # Пользователи
    def add_user(self, id):
        query = "INSERT INTO users (id) VALUES(?)"
        with self.connection:
            self.cursor.execute(query, (id,))

    def user_exist(self, id):
        query = "SELECT 1 FROM users WHERE id = ?"
        with self.connection:
            return bool(self.cursor.execute(query, (id,)).fetchone())

    # Предметы
    def add_item(self, name, price):
        query = "INSERT INTO items (name, price) VALUES(?, ?)"
        with self.connection:
            self.cursor.execute(query, (name, price))

    def get_items_by_status(self, status):
        query = "SELECT * FROM items WHERE status = ?"
        with self.connection:
            return self.cursor.execute(query, (status,)).fetchall()

    def get_id_item(self, name):
        query = f"SELECT id FROM items WHERE name = ?"
        with self.connection:
            result = self.cursor.execute(query, (name,)).fetchone()
            if result:
                return result[0]
            else:
                return None
    # Корзина
    def add_order(self, id_user, id_item):
        query = "INSERT INTO orders (id_user, id_item) VALUES(?, ?)"
        with self.connection:
            self.cursor.execute(query, (id_user, id_item))

    def get_orders(self, id_user, status):
        query = """
        SELECT * FROM orders 
        JOIN items ON orders.id_item = items.id 
        WHERE orders.id_user = ? AND orders.status = ?
        """
        with self.connection:
            return self.cursor.execute(query, (id_user, status)).fetchall()

    def delete_order(self, id_user, id_item):
        query = "DELETE FROM orders WHERE id_user = ? AND id_item = ? AND status = 0"
        with self.connection:
            self.cursor.execute(query, (id_user, id_item))

    #получить количество товара в корзине
    def get_count(self, id_item, id_user, status):
        query = "SELECT count FROM orders WHERE id = ? AND id_user = ? AND status = ?"
        with self.connection:
            item = self.cursor.execute(query, (id_item, id_user, status)).fetchone()
            if item:
                return item[0]
            return 0

    # Закрытие соединения
    def close(self):
        self.connection.close()
