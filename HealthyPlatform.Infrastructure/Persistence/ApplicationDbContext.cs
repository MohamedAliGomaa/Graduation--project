using HealthyPlatform.Domain.Entities;
using HealthyPlatform.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HealthyPlatform.Infrastructure.Persistence
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser> 
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext>options):base(options) 
        {

        }

        public DbSet<UserProfile> UserProfiles => Set<UserProfile>();

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // Configure UserProfile Entity
            builder.Entity<UserProfile>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.HeighCm).HasPrecision(5, 2);
                entity.Property(e => e.TargetWeighKg).HasPrecision(5, 2);   
                entity.HasIndex(e => e.UserId).IsUnique(); // 1-to-1 relationship with User

            });

        }
    }
}
