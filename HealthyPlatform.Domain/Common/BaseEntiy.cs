using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HealthyPlatform.Domain.Common
{
    public abstract class BaseEntiy
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public DateTime? UpdateTime {get ; set;} = DateTime.Now;    



    }
}
