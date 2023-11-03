
function UpdateDropdown(id, collection) {
    $("#"+id).html("");
    // $("#"+id).append($("<option>").text("none").val(""));
    for(var i=0; i< collection.length; i++){
        $("#"+id).append($("<option>").text(collection[i].name + " (" + collection[i].id + ")").val(collection[i].id));
    }
}

function GetMapKey() {
    return "taranakibasehospital";
    const params = new Proxy(new URLSearchParams(window.location.search), {
        get: (searchParams, prop) => searchParams.get(prop),
    });
    return params.key;
}

// used to display feedback information to the user
function ShowUserMessage(type, message, displayDuration) {
    // if it's an error message then the user has to close it; -1 duration means manual close
    let duration = type === 'danger' ? -1  : 8000;
    // if a duration is passed in then use that instead
    if(displayDuration) {
        duration = displayDuration;
    }
    Toastify({
        text: message,
        className: "alert-"+type,
        duration: duration,
        close: true
    }).showToast();
}