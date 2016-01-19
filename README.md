fibOR
-----
        这是个基于FibJs的WebService框架，目的是方便简单的把本地数据库资源转成网络上的Restful风格的服务。
        大致符合OData和Restful标准。为啥是大致符合呢？因为本人对标准也不熟悉啊，依葫芦画瓢，有的地方也可能按个人喜好改变了，哈哈。


OData部分完成度
---
OData语法
$filter,$orderby,$skip,$top,$select,$count,$metadata

比较操作符

| 操作符 | 描述     | 例子           |
| ------ | -------- | -------------- |
| eq     | 等于     | city eq '上海' |
| ne     | 不等于   | city ne '上海' |
| gt     | 大于     | price gt 20    |
| ge     | 大于等于 | price ge 10    |
| lt     | 小于     | price lt 20    |
| le     | 小于等于 | price le 10    |


逻辑操作符(其中not操作符仅完成contains，startswith，endwith三个函数部分)

| 操作符 | 描述     | 例子                          |
| ------ | -------- | ----------------------------- |
| and    | 逻辑与   | price le 200 and price gt 3.5 |
| or     | 逻辑或   | Price le 3.5 or price gt 200  |
| not    | 逻辑非   | not endwith(name, '牛奶')     |


分组操作符

| 操作符 | 描述       | 例子                                    |
| ------ | ---------- | --------------------------------------- |
| ( )    | 优先级分组 | (price gt 5 or price le 3) and id gt 10 |


字符串函数

| 操作符      | 例子                     |
| ----------- | ------------------------ |
| contains    | contains(name, '公司')   |
| endswith    | endswith(name, '公司')   |
| startswith  | startswith(name, '公司') |
| length      | length(name) eq 6        |

Restful部分
---------
HTTP方法
GET
PUT
POST
DELETE
OPTIONS

数据库支持
MYSQL
SQLITE

将来目标
----
    
     1. 完善各部分功能
     2. 将Fibjs支持的数据库都增加进去

使用方法
----

    在medadata文件夹里面定义好元数据，启动服务，搞定。
    
    元数据简单格式，此时元数据文件名对应表名
    {
        "type": "sqliteTable",//元数据类型，目前有(sqliteTable，mysqlTable)
        "content": {
            "fields": {
                "id": "number",//表中字段和类型,目前有(number,string,datetime,binary)
                "filename": "string",
                "createtime": "datatime",
                "filedata": "binary"
            }
        },
        "config": {
            "resource": "sqlite:./fibOR_Test.db",//数据库连接
        }
    }
    
    元数据完整格式
    {
        "name": "test", //元数据名称,默认是文件名
        "type": "sqliteTable", //元数据类型
        "content": {
            "fields": {
                "id": {
                    "type": "number", //元数据字段类型
                    "pattern": "18,2", //字段格式
                    "select": true, //是否允许查询
                    "update": true, //是否允许更新
                    "insert": true, //是否允许插入
                    "condition": true //是否允许作为条件
                },
                "createtime": {
                    "type": "datetime",
                    "pattern": "YYYY-MM-DD",
                    "select": true,
                    "update": true,
                    "insert": false,
                    "condition": false
                }
            },
            "index": { //逐渐
                "fields": "id", //可以多个，","分割
                "must": false //是否强制需要
            }
        },
        "action": { //设置是否允许http方法，默认自动更具actor生成
            "GET": true,
            "PUT": true,
            "POST": true,
            "DELETE": true,
            "OPTIONS": true,
            "HEAD": true
        },
        "comment": "", //元数据资源描述
        "config": {
            "resource": "sqlite:./fibOR_Test.db", //资源连接串
            "mapping": { //映射
                "table": "midi", //表示数据库中实际的表名
                "fields": {
                    "id": "sid" //键为元数据中定义的字段，值为数据库中对应的实际字段
                }
            }
        }
    }   
    
    详细的使用方法还没写好，测试用例也在编写，慢慢填坑了

