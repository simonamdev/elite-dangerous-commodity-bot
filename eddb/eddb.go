package eddb

import (
    "fmt"
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

func GetStationsSellingCommodityFromStorage(commodityId int) ([]int) {
    db := getDbConnection()
    defer db.Close()
    queryStatement := `SELECT stationId FROM listings WHERE commodityId == %d;`
    // Not ideal, but there does not seem to be a way to prepare a statement without providing the number of rows
    // you will receive
    rows, err := db.Query(fmt.Sprintf(queryStatement, commodityId))
    if err != nil {
        panic(err)
    }
    defer rows.Close()
    var stationIds []int
    for rows.Next() {
        var stationId int
        err = rows.Scan(&stationId)
        if err != nil {
            panic(err)
        }
        stationIds = append(stationIds, stationId)
    }
    fmt.Println(fmt.Sprintf("%d Stations found which sell commodity with ID: %d", len(stationIds), commodityId))
    return stationIds
}
