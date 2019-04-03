const { ipcRenderer } = require('electron');
var myConfirmData;
var localData = [];
var myArray = [];
var myController = 1;
var autoId = 0;
var rowId = [];
var db = openDatabase('mydb', '1.0', 'Test DB', 2 * 1024 * 1024);
db.transaction(function (tx) {
    tx.executeSql('CREATE TABLE IF NOT EXISTS dataTable(file_id INTEGER PRIMARY KEY,fileName,code, mode,description)');
});
var myCode;
var editor = CodeMirror.fromTextArea
    (document.getElementById('textarea'), {
        mode: "python",
        theme: "dracula",
        lineNumbers: true,
        autoCloseTags: true,
        styleActiveLine: true
    });
window.onload = function dataBind() {
    var promise1 = new Promise(function (resolve, reject) {
        db.transaction(function (x) {
            x.executeSql("SELECT * FROM dataTable ", [], function (x, rs) {
                for (var i = 0; i < rs.rows.length; i++) {
                    var row = rs.rows.item(i);
                    myArray[i] = {
                        fileName: row["fileName"], code: row["code"], mode: row["mode"], description: row["description"]
                    }
                }
                resolve(myArray);
            });
        });
    });
    promise1.then(function (value) {
        for (var i = 0; i < value.length; i++) {
            var mode = value[i].mode;
            var myFileName = value[i].fileName;
            var list = document.getElementById("myUL");
            var entry = document.createElement('li');
            entry.setAttribute("class", mode);
            entry.setAttribute("id", autoId);
            autoId++;
            entry.title = myFileName;
            entry.appendChild(document.createTextNode(myFileName));
            list.appendChild(entry);
        }
    });
}
function selectMode() {
    editor.setOption("mode", document.getElementById("mode").value);
}
function saveCode() {
    var description = document.getElementById("description").value;
    var myFileName;
    if (document.getElementById("fileName").value === "" || editor.getValue() === "") {
        $('#error1').css('display', 'block');
        $('#error2').css('display', 'none');
        $('.alert').css('display', 'block');
    }
    else {
        var promise = new Promise((resolve, reject) => {
            myFileName = document.getElementById('fileName').value;
            db.transaction(function (tx) {
                tx.executeSql("SELECT fileName FROM dataTable", [], function (tx, rs) {
                    for (var i = 0; i < rs.rows.length; i++) {
                        var row = rs.rows.item(i);
                        localData[i] = {
                            file: row["fileName"]
                        }
                    }
                    resolve(localData);
                });
            });
        })
        promise.then((localData) => {
            for (var i = 0; i < localData.length; i++) {
                if (myFileName === localData[i].file) {
                    myController = 0;
                }
            }
            if (myController == 1) {
                $('.alert').css('display', 'none');
                var mode = editor.getMode().name;
                let text = document.getElementById("fileName").value;
                myCode = editor.getValue();
                db.transaction(function (tx) {
                    tx.executeSql('INSERT INTO dataTable (fileName, code, mode,description) VALUES (?,?,?,?)', [text, myCode, document.getElementById("mode").value, description]);
                });
                var list = document.getElementById('myUL');
                var entry = document.createElement('li');
                entry.title = text;
                entry.setAttribute("class", mode);
                entry.setAttribute("id", autoId);
                autoId++;
                entry.appendChild(document.createTextNode(text));
                list.appendChild(entry);
                document.getElementById("fileName").value = "";
                editor.setValue("");
                document.getElementById("description").value = "";
            }
            else {
                $('#error1').css('display', 'none');
                $('#error2').css('display', 'block');
                $('.alert').css('display', 'block');
                myController = 1;
            }
        })
    }
}
function rowClickFunction(x, rowClickId) {
    $('#myButton').css('display', 'none');
    $('.deleteButton').css('display', 'block');
    $('.updateButton').css('display', 'block');
    var selectFileName = x;
    var promise2 = new Promise(function (resolve, reject) {
        db.transaction(function (tx) {
            tx.executeSql("SELECT file_id,fileName,code,mode,description FROM dataTable WHERE fileName=? ", [selectFileName], function (tx, rs) {
                for (var i = 0; i < rs.rows.length; i++) {
                    var row = rs.rows.item(i);
                    localData[i] = {
                        fileName: row["fileName"], code: row["code"], mode: row["mode"], description: row["description"]
                    }
                }
                rowId[0] = { file_id: row["file_id"], row_id: rowClickId }
                resolve(localData[0]);
            });
        });
    });
    promise2.then(function (value) {
        editor.setOption("mode", value.mode);
        editor.setValue(value.code);
        var element = document.getElementById("mode");
        element.value = value.mode;
        document.getElementById("description").value = value.description;
        document.getElementById("fileName").value = value.fileName;
    });
}
function onBackFunction() {
    $("#myButton").css("display", "block");
    $('.deleteButton').css('display', 'none');
    $('.updateButton').css('display', 'none');
    editor.setValue("");
    document.getElementById("description").value = "";
    document.getElementById("fileName").value = "";
}
document.getElementById("myUL").addEventListener("click", function (e) {
    if (e.target && e.target.nodeName == "LI") {
        rowClickFunction(e.target.innerHTML, e.target.id);
    }
});
$(document).ready(function () {
    $("#myInput").on("keyup", function () {
        var value = $(this).val().toLowerCase();
        $("#myUL li").filter(function () {
            $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1)
        });
    });
});
function deleteFunction() {
    ipcRenderer.send('open-error-dialog');
    ipcRenderer.on('asynchronous-reply', (event, arg) => {
        if (arg === 0) {
            db.transaction(function (tx) {
                tx.executeSql('DELETE FROM dataTable where file_id =?', [rowId[0].file_id], function (transaction, result) {
                    console.log(result);
                    console.log('Deleted Success');
                }, function (transaction, error) {
                    console.log(error);
                });
            });
            var item = document.getElementById(rowId[0].row_id);
            document.getElementById("myUL").removeChild(item);
            onBackFunction();
        }
    })

}
function updateFunction() {
    let fileName = document.getElementById("fileName").value;
    let description = document.getElementById("description").value;
    let mode = editor.getMode().name;
    let myCode = editor.getValue();
    var updatePromise = new Promise((resolve, reject) => {
        db.transaction(function (tx) {
            tx.executeSql('UPDATE dataTable SET fileName=?,code=?,mode=?,description=? WHERE file_id =?', [fileName, myCode, mode, description, rowId[0].file_id]);
            resolve(true);
        })
    })
    updatePromise.then((value) => {
        let myListItem = document.getElementById(rowId[0].row_id);
        myListItem.classList.value = mode;
        myListItem.title = fileName;
        myListItem.innerHTML = fileName;
    })
}