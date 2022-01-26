export default {
    tsToDate:(timeStamp: number): string => {
        let dateTime = new Date(timeStamp * 1000)
        let year = dateTime.getFullYear();
        let month = dateTime.getMonth() + 1; //this method return value between 0-11
        let date = dateTime.getDate();
        let hour = dateTime.getHours();
        let min = dateTime.getMinutes();
        let sec = dateTime.getSeconds();
        return `${year}-${month >= 10? month:"0"+ month}-${date >= 10? date:"0"+ date} ${hour >= 10? hour:"0"+ hour}:${min >= 10? min:"0"+ min}:${sec >= 10? sec:"0"+ sec}`
    }
}