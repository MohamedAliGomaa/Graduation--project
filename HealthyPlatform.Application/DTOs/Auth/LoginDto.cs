using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HealthyPlatform.Application.DTOs.Auth
{
    public class LoginDto
    {
        [Required(ErrorMessage = "البريد الإلكتروني مطلوب")]
        [EmailAddress(ErrorMessage = "صيغة البريد الإلكتروني غير صحيحة")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "كلمة السر مطلوبة")]
        public string Password { get; set; } = string.Empty;


    }
}
