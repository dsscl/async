function doubleAfter2seconds(num) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            reject(2 * num)
        }, 2000)
    })
}
async function testResult() {
    let result = await doubleAfter2seconds(30)
    console.log(result)
}
