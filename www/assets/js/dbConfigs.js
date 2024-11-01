let db;
let database;

document.addEventListener('deviceready', async function () {
    const dbReadyEvent = new CustomEvent('dbready');
    database = window.sqlitePlugin.openDatabase({ name: 'techstore.db', location: 'default' });

    db = {
        /**
         * Thực hiện một truy vấn SQL
         * @param {string} sql - Chuỗi truy vấn
         * @param {array} params - Tham số truy vấn
         */
        query: (sql, params = []) => {
            return new Promise((resolve, reject) => {
                database.transaction(function (txn) {
                    if (sql.trim().toLowerCase().startsWith('select'))
                        txn.executeSql(sql, params, function (tx, res) {
                            resolve(Array.from({ length: res.rows.length }, (_, i) => res.rows.item(i)));
                        }, function (tx, error) { reject(error); });
                    else
                        txn.executeSql(sql, params, function (tx, res) { resolve(res); },
                            function (tx, error) { reject(error); });
                });
            });
        },

        /**
         * Thực hiện nhiều truy vấn SQL cùng lúc
         * @param {array} queries - Danh sách chuỗi truy vấn
         */
        queryAll: (queries = []) => {
            const promises = queries.map(query => db.query(query.sql, query.params));
            return Promise.all(promises);
        },
    };

    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS SpendList (
                    Id          INTEGER PRIMARY KEY,
                    Name        TEXT,
                    AtCreate    TEXT DEFAULT CURRENT_TIMESTAMP,
                    AtUpdate    TEXT DEFAULT CURRENT_TIMESTAMP,
                    LastEntry   TEXT,
                    Status      INTEGER DEFAULT 1
                )
            `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS SpendItem (
                    Id          INTEGER PRIMARY KEY,
                    ListId      INTEGER REFERENCES SpendingList (Id),
                    Name        TEXT,
                    Price       REAL DEFAULT 0,
                    Details     TEXT,
                    AtCreate    TEXT DEFAULT CURRENT_TIMESTAMP,
                    AtUpdate    TEXT DEFAULT CURRENT_TIMESTAMP,
                    Status      INTEGER DEFAULT 1
                )
            `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS Note (
                    Id          INTEGER  PRIMARY KEY,
                    NameList    TEXT,
                    Content     TEXT,
                    AtCreate    DATETIME DEFAULT CURRENT_TIMESTAMP,
                    AtUpdate    DATETIME DEFAULT CURRENT_TIMESTAMP,
                    Status      INTEGER  DEFAULT 1
                );
            `);

        await db.query('INSERT INTO SpendList (Name) VALUES (?)', ['Danh sách 1']);
        await db.query('INSERT INTO SpendList (Name) VALUES (?)', ['Danh sách 2']);
        await db.query('INSERT INTO SpendItem (ListId, Name, Price) VALUES (?, ?, ?)', [1, 'Ăn Sáng', 10000]);
        await db.query('INSERT INTO SpendItem (ListId, Name, Price) VALUES (?, ?, ?)', [1, 'Ăn Trưa', 20000]);
        await db.query('INSERT INTO SpendItem (ListId, Name, Price) VALUES (?, ?, ?)', [1, 'Ăn Chiều', 10000]);
        await db.query('INSERT INTO SpendItem (ListId, Name, Price) VALUES (?, ?, ?)', [1, 'Ăn Tối', 20000]);

        document.dispatchEvent(dbReadyEvent);
    } catch (e) {
        console.log(e);
        showToast('Khởi tạo cơ sở dữ liệu thất bại', 'error');
    }
});