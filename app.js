const express = require('express');
const { mainModule } = require('process');
const app = express();

const snapshotUrl = 'https://app.instagantt.com/shared/6383776600b3ed76aee1c3d3'+'.json';
let snapshot;
async function fetchDataAsync(url) {
    const response = await fetch(url);
    snapshot = await response.json();
    const {tasks} = snapshot;
    const mgtasks = tasks.filter((task)=>{
        if(task.subtasks == 0){
            return task.id;
        } 
    });
    
    const test = new Map();
    mgtasks.forEach((mgt)=>{
        if(!test.has(mgt.parent_priority_heading)){
            test.set(mgt.parent_priority_heading, [mgt]);
        }
        else{
            test.set(mgt.parent_priority_heading, [...test.get(mgt.parent_priority_heading), mgt]);
        }
    });

    for (let key of test.keys()) {
        const value = test.get(key);
        let count = 0;
        value.forEach((val,i,arr)=>{
            if(val.dependent_of.length == 0 || val.dependent_of[0] == ""){
                console.log(val.name);
                count++;
            }
        });
        test.set(key, count);
    }
    console.log(test);
    return test;
}

app.get('/', async (req, res, next)=>{
    let test = await fetchDataAsync(snapshotUrl);
    for(let key of test.keys()){
        if(test.get(key) > 1){
            return res.status(400).json({ error : "all the MGT must have a predecessor accept the first task."});
        }
    }
    res.json({ error : "no errors"});        
});

app.use((err,req,res,next)=>{
    const error = err.message || "Something Went Wrong, Please try Again !!"
    res.json(error);
});

app.listen(process.env.PORT || 3000, ()=>{
    console.log("Running");
});