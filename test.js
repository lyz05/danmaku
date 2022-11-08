
function main() {
    const p1 = new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve('p1');
        }, 500);
    });
    const p2 = new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve('p2');
        }, 300);
    });
    const Promises = [p1,p2];
    let count = 0;
    p1.then((value) => {
        count ++;
      console.log(value)
    })
    p2.then((value) => {
        count ++;
        console.log(value)
    })
    while (count<2) ;
    console.log('All promise done');
}
main()