using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace HealthyPlatform.Application.Common
{
    public class ApiResponse<T>
    {
        public bool Succeeded { get; set; }
        public string Message { get; set; }
        public List<string> Error { get; set; }
        public T? Data{ get; set; }

        public static ApiResponse<T>Success(T data , string message = "تمت العملية بنجاح" )
        {
            return new ApiResponse<T> { Succeeded = true, Message = message, Data = data };
        }

        public static ApiResponse<T> Failure(List<string> errors, string massage = "حدث خطأ اثناء معالجة الطلب")
        {
            return new ApiResponse<T> { Succeeded = false, Message = massage, Error = errors };
        }


        public static ApiResponse<T> Failure(string error, string massage = "حدث خطأ اثناء معالجة الطلب")
        {
            return new ApiResponse<T> { Succeeded = false, Message = massage, Error = new List<string> { error } };
        }



    }
}
