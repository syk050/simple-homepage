$(function(){
    function get2digits(num){
        return ('0' + num).slice(-2);
    }

    function getDate(dateObj){
        // Date 타입인가?
        if(dateObj instanceof Date){
            return dateObj.getFullYear() + '-' + get2digits(dateObj.getMonth()+1) + '-' + get2digits(dateObj.getDate());
        }
    }

    function getTime(dateObj){
        if(dateObj instanceof Date){
            return get2digits(dateObj.getHours()) + ':' + get2digits(dateObj.getMinutes()) + ':' + get2digits(dateObj.getSeconds());
        }
    }

    function convertDate(){
        $('[data-date]').each(function(){
            var dateString = $(this).data('date');
            if(dateString){
                var date = new Date(dateString);
                $(this).html(getDate(date));
            }
        });
    }

    function convertDateTime(){
        $('[data-date-time]').each(function(){
            var dateString = $(this).data('date-time');
            if(dateString){
                var date = new Date(dateString);
                $(this).html(getDate(date) + ' ' + getTime(date));
            }
        });
    }

    convertDate();
    convertDateTime();
});