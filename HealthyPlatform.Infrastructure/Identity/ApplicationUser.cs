using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HealthyPlatform.Infrastructure.Identity
{
    public class ApplicationUser : IdentityUser
    {
        public string FulllName { get; set; }  = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow; 
    }
}
