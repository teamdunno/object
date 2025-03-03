import * as object from "./Object.ts"
// make a new list of function that only includes `is..()` function and `realTypeof`
Deno.test({
    name:"Get all function tests",
    fn(){
        const obj = Object(object)
        const allowedFuncs = Object.keys(obj).filter((name)=>name.startsWith("is")||name==="realTypeof")
        const listOfObject = {primitives:[0, "ok"], "'function'":[()=>{}, class{}], 
            "null":[null, undefined], object:[{}, {name:"ok"}], 
            "array":[[], ["hi"], new Uint8Array(), new Uint8Array(8)]}
        let res = ""
        const objk = Object.keys(listOfObject)
        for (let i=0;i<objk.length;i++) {
            const name = objk[i]
            const objs = listOfObject[name as keyof typeof listOfObject]
            res += `===\n=== ${name}\n===\n\n`
        for (let v=0;v<objs.length;v++) {
            const o = objs[v]
            res += `Literal object (${typeof o==="object"&&o!==null?JSON.stringify(o):o}): \n`
            for (let f=0;f<allowedFuncs.length;f++) {
                res += `result of '${allowedFuncs[f]}': ${obj[allowedFuncs[f]](o)}\n`
            }
            res += "\n"
        }
        }
        console.log(res)
    }
})