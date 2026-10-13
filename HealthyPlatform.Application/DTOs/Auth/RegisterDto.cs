using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HealthyPlatform.Application.DTOs.Auth
{
    public class RegisterDto
    {
        [Required(ErrorMessage = "الاسم الأول مطلوب")]
        public string FirstName { get; set; } = string.Empty;

        [Required(ErrorMessage = "الاسم الأخير مطلوب")]
        public string LastName { get; set; } = string.Empty;

        [Required(ErrorMessage = "تاريخ الميلاد مطلوب")]
        public DateTime DateOfBirth { get; set; }

        [Required(ErrorMessage = "رقم الهاتف مطلوب")]
        [Phone(ErrorMessage = "صيغة رقم الهاتف غير صحيحة")]
        public string PhoneNumber { get; set; } = string.Empty;

        [Required(ErrorMessage = "البريد الإلكتروني مطلوب")]
        [EmailAddress(ErrorMessage = "صيغة البريد الإلكتروني غير صحيحة")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "كلمة السر مطلوبة")]
        [MinLength(8, ErrorMessage = "كلمة السر يجب ألا تقل عن 8 أحرف")]
        public string Password { get; set; } = string.Empty;

        [Required(ErrorMessage = "تأكيد كلمة السر مطلوب")]
        [Compare("Password", ErrorMessage = "كلمة السر وتأكيد كلمة السر غير متطابقين")]
        public string ConfirmPassword { get; set; } = string.Empty;



    }
}
