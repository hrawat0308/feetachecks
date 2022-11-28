const express = require('express');
const { mainModule } = require('process');
const app = express();

const snapshotUrl = 'https://app.instagantt.com/shared/638462f35e0c491556993f4a'+'.json';
let snapshot;

const checkDependentOfArray = (arr) => {
    if(arr.length === 0 || (arr.length == 1 && arr[0] == "")){
        return true;
    }
    else{
        return false;
    }
}

const getSuccessorStartTime = (tasks, successorsID) => {
    for(let i = 0; i < tasks.length; i++){
        if(tasks[i].id == successorsID){
            // console.log("successor time", tasks[i].start);
            return new Date(tasks[i].start);
        }
    }
}

const getPredecessorDueTime = (tasks,predecessorID) => {
    for(let i = 0; i < tasks.length; i++){
        if(tasks[i].id == predecessorID){
            // console.log("predcessor time",tasks[i].due);
            return new Date(tasks[i].due);
        }
    }
}

const checkSuccessorTime = (tasks, curTask) => {
    let successors = [];
    let result = {
        status : false,
        error : "time",
        at: []
    }
    let timeObject = {
        P_ID : "",
        S_ID: "",
        P_date : "",
        S_date: ""
    }
    for(let i = 0; i < tasks.length; i++){
        if(tasks[i].dependent_of.length > 0){
            if(tasks[i].dependent_of.includes(curTask)){
                successors.push(tasks[i].id);
            }
        }
    }

    for(let i = 0; i < successors.length; i++){
        let P_Date = getPredecessorDueTime(tasks,curTask); 
        let S_Date = getSuccessorStartTime(tasks,successors[i]);
        if( P_Date > S_Date){
            timeObject.P_ID = curTask;
            timeObject.S_ID = successors[i];
            timeObject.P_date = P_Date;
            timeObject.S_date = S_Date;
            result.at = [...result.at, timeObject];
        }
    }

    if(result.at.length == 0){
        result.status = true;
    }
    return result;
    
}

const checkForSubtaskandDependency = (tasks) => {
    let result = {
        status: false,
        at : []
    }
    for(let i = 0; i < tasks.length; i++){
        if(tasks[i].subtasks == 0 && checkDependentOfArray(tasks[i].dependent_of) && tasks[i].is_milestone == false){
            result.at = [...result.at, { id: tasks[i].id, name :tasks[i].name}]  
        }
    };
    const firstTask = findTask1(tasks);
    result.at = result.at.filter((obj)=>{
        return (obj.id !== firstTask.id)
    });

    if(result.at.length == 0){
        result.status = true;
    }
    return result;
}

const findTask1 = (tasks) => {
    let firstTask = new Date(tasks[0].start);
    let task1 = {
        id : tasks[0].id,
        name : tasks[0].name
    };
    tasks.forEach((task)=>{
        if(new Date(task.start) < firstTask && task.subtasks == 0){
            firstTask = new Date(task.start);
            task1 = {
                id : task.id,
                name: task.name
            }
        }
    });
    return task1;
}

async function fetchDataAsync(url) {
    const response = await fetch(url);
    snapshot = await response.json();
    const {tasks} = snapshot;
    let subtasks = tasks.filter((task)=>{
        return task.subtasks == 0 && task.is_milestone == false;
    });
    let subtasksIDs = subtasks.map((task)=>{
        return task.id;
    });

    let result1 = checkForSubtaskandDependency(subtasks);
    let result2 = {
        error : "time",
        status: false,
        at: []
    };
    for(let i = 0; i < subtasksIDs.length; i++){
        const timeResult = checkSuccessorTime(subtasks, subtasksIDs[i]); 
        if(!timeResult.status){
            result2.at = [...result2.at, ...timeResult.at];
        }   
    }
    
    if(result2.at.length == 0){
        result2.status = true;
    }
    result1.time = result2;
    return result1;
}

app.get('/', async (req, res, next)=>{
    let check = await fetchDataAsync('https://app.instagantt.com/shared/637dea3d7c23784f48e74bb0.json');       
    res.json(check);   
});

app.use((err,req,res,next)=>{
    const error = err.message || "Something Went Wrong, Please try Again !!"
    res.json(error);
});

app.listen(process.env.PORT || 3000, ()=>{
    console.log("Running");
});