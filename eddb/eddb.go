package eddb

import (
    "database/sql"
    _ "github.com/mattn/go-sqlite3"
)

func getDbConnection() (*sql.DB) {
    db, err := sql.Open("sqlite3", "./data/eddb.db")
    if err != nil {
        panic(err)
    }
    return db
}

func GetCommodityIdFromStorage(commodity string) (int) {
    db := getDbConnection()
    defer db.Close()
    checkStatement := `SELECT commodityId FROM commodities WHERE name == ?;`
    statement, err := db.Prepare(checkStatement)
    if err != nil {
        panic(err)
    }
    defer statement.Close()
    var commodityId int
    err = statement.QueryRow(commodity).Scan(&commodityId)
    return commodityId
}

func GetSystemIdFromStorage(system string) (int) {
    db := getDbConnection()
    defer db.Close()
    checkStatement := `SELECT systemId FROM populatedSystems WHERE name == ?;`
    statement, err := db.Prepare(checkStatement)
    if err != nil {
        panic(err)
    }
    defer statement.Close()
    var systemId int
    err = statement.QueryRow(system).Scan(&systemId)
    return systemId
}
