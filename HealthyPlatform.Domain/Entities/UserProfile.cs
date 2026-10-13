using HealthyPlatform.Domain.Common;
using HealthyPlatform.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HealthyPlatform.Domain.Entities
{
    public class UserProfile : BaseEntiy
    {
        public string UserId { get; set; } = string.Empty; // مربوط بـ Identity User Id
        public DateTime BirthDate { get; set; } 
        public Gender Gender { get; set; }
        public decimal HeighCm { get; set; }    
        public ActivityLevel ActivityLevel { get; set; }
        public Goal Goal { get; set; }

        public decimal TargetWeighKg { get; set; }
        public int DailyWaterGoalMl { get; set; }
        public int DailyCalorieGoal { get; set; }

        // Calculated Helper Property 
        public int Age
        {
            get
            {
                var age = DateTime.UtcNow.Year - BirthDate.Year;
                if (BirthDate.Date > DateTime.UtcNow.AddYears(-age)) age--;
                return age;
            }
        }





    }
}
